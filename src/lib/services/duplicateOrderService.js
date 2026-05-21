import mongoose from "mongoose";
import Order from "@/lib/db/models/order";
import Product from "@/lib/db/models/product";

/**
 * Normalizes a string for comparison.
 */
function normalizeString(str) {
  if (!str) return "";
  return str.toString().toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Compares two shipping addresses to see if they are substantially the same.
 */
function isSameAddress(addr1, addr2) {
  if (!addr1 || !addr2) return false;
  
  const fields = ["fullName", "addressLine1", "city", "state", "pincode"];
  return fields.every(field => {
    return normalizeString(addr1[field]) === normalizeString(addr2[field]);
  });
}

/**
 * Compares two sets of items to see if they have identical products and quantities.
 */
function isSameItems(items1, items2) {
  if (!items1 || !items2) return false;
  if (items1.length !== items2.length) return false;

  const map1 = {};
  items1.forEach(it => {
    const prodId = it.product?.toString() || it.productId?.toString();
    if (prodId) map1[prodId] = (map1[prodId] || 0) + (it.quantity || 0);
  });

  const map2 = {};
  items2.forEach(it => {
    const prodId = it.product?.toString() || it.productId?.toString();
    if (prodId) map2[prodId] = (map2[prodId] || 0) + (it.quantity || 0);
  });

  const keys1 = Object.keys(map1);
  const keys2 = Object.keys(map2);
  if (keys1.length !== keys2.length) return false;

  return keys1.every(k => map1[k] === map2[k]);
}

/**
 * Gets the priority of the source.
 * Priority order: Customer (1) > Vendor (2) > ODT (3)
 */
function getSourcePriority(order) {
  const source = order.orderSource || "Customer";
  if (source === "Customer") return 1;
  if (source === "Vendor") return 2;
  return 3;
}

export async function detectAndGroupOrder(orderDocOrId) {
  try {
    let order = orderDocOrId;
    if (typeof order === "string" || order instanceof mongoose.Types.ObjectId) {
      order = await Order.findById(order);
    }
    
    if (!order) return { success: false, error: "Order not found" };

    // Ignore if order is cancelled, or duplicate status is ignored/separate
    if (["cancelled", "canceled"].includes(order.status?.toLowerCase())) {
      return { success: true, duplicateDetected: false };
    }
    if (["ignored", "separate_valid"].includes(order.duplicateStatus)) {
      return { success: true, duplicateDetected: false };
    }

    const orderTime = order.placedAt || order.createdAt || new Date();
    const timeWindow = 24 * 60 * 60 * 1000; // 24 hours time window

    // Find candidate duplicate orders matching user or customer phone number
    const phoneQuery = order.shippingAddress?.phone 
      ? { "shippingAddress.phone": order.shippingAddress.phone } 
      : { user: order.user };

    const candidates = await Order.find({
      _id: { $ne: order._id },
      $or: [
        { user: order.user },
        phoneQuery
      ],
      status: { $nin: ["cancelled", "canceled"] },
      duplicateStatus: { $nin: ["ignored", "separate_valid"] },
      placedAt: {
        $gte: new Date(orderTime.getTime() - timeWindow),
        $lte: new Date(orderTime.getTime() + timeWindow)
      }
    });

    const duplicates = [];
    for (const cand of candidates) {
      // Check total
      if (Math.abs((cand.total || 0) - (order.total || 0)) > 0.02) continue;

      // Check items
      if (!isSameItems(order.items, cand.items)) continue;

      // Check address
      if (!isSameAddress(order.shippingAddress, cand.shippingAddress)) continue;

      duplicates.push(cand);
    }

    if (duplicates.length === 0) {
      return { success: true, duplicateDetected: false };
    }

    // Determine the duplicateGroupId
    let groupId = order.duplicateGroupId;
    if (!groupId) {
      const foundGroup = duplicates.find(d => d.duplicateGroupId);
      groupId = foundGroup ? foundGroup.duplicateGroupId : new mongoose.Types.ObjectId();
    }

    // Collect all orders in the group
    const allOrders = [order, ...duplicates];

    // Prioritize and find the MASTER ORDER
    // Customer direct order > Vendor order > ODT Team order.
    // If sources are identical, earlier created order becomes the master.
    allOrders.sort((a, b) => {
      const priA = getSourcePriority(a);
      const priB = getSourcePriority(b);
      if (priA !== priB) return priA - priB;

      const timeA = new Date(a.placedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.placedAt || b.createdAt || 0).getTime();
      return timeA - timeB;
    });

    const masterOrder = allOrders[0];
    const shadowDuplicates = allOrders.slice(1);

    // Update Master Order
    await Order.updateOne(
      { _id: masterOrder._id },
      {
        $set: {
          isDuplicateOrder: false,
          duplicateGroupId: groupId,
          duplicateStatus: "pending_review",
          masterOrderId: masterOrder._id,
          duplicateOf: null
        }
      }
    );

    // Update Shadow Duplicates
    for (const shadow of shadowDuplicates) {
      await Order.updateOne(
        { _id: shadow._id },
        {
          $set: {
            isDuplicateOrder: true,
            duplicateGroupId: groupId,
            duplicateStatus: "pending_review",
            masterOrderId: masterOrder._id,
            duplicateOf: masterOrder._id
          }
        }
      );
    }

    return {
      success: true,
      duplicateDetected: true,
      duplicateGroupId: groupId.toString(),
      masterOrderId: masterOrder._id.toString(),
      shadowDuplicatesCount: shadowDuplicates.length
    };
  } catch (err) {
    console.error("[DUPLICATE DETECTOR ERROR]", err);
    return { success: false, error: err.message };
  }
}

/**
 * Scan all orders within a time window (in hours) to group duplicates retroactively.
 */
export async function scanAllOrdersForDuplicates(timeWindowHours = 168) {
  try {
    const timeLimit = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);
    const orders = await Order.find({
      placedAt: { $gte: timeLimit },
      status: { $nin: ["cancelled", "canceled"] },
      duplicateStatus: { $nin: ["ignored", "separate_valid"] }
    }).sort({ placedAt: 1 });

    let scanCount = 0;
    let groupCount = 0;

    for (const order of orders) {
      // If already evaluated, skip
      if (order.duplicateGroupId) continue;

      const res = await detectAndGroupOrder(order);
      scanCount++;
      if (res.success && res.duplicateDetected) {
        groupCount++;
      }
    }

    return { success: true, scanCount, groupCount };
  } catch (err) {
    console.error("[SCAN ERROR]", err);
    return { success: false, error: err.message };
  }
}

/**
 * Resolve duplicates of a group
 */
export async function resolveDuplicateGroup(groupId, action, targetOrderId = null) {
  try {
    if (!groupId) return { success: false, error: "duplicateGroupId is required" };

    const parsedGroupId = mongoose.Types.ObjectId.isValid(groupId) 
      ? new mongoose.Types.ObjectId(groupId) 
      : groupId;

    const orders = await Order.find({ duplicateGroupId: parsedGroupId });
    if (orders.length === 0) return { success: false, error: "No orders found in this duplicate group" };

    if (action === "merge") {
      // Find the master order
      const masterOrder = orders.find(o => o.isDuplicateOrder === false);
      if (!masterOrder) return { success: false, error: "No master order found in group" };

      // Set all to merged, and cancel all duplicate orders
      await Order.updateMany(
        { duplicateGroupId: parsedGroupId },
        { $set: { duplicateStatus: "merged" } }
      );

      // Cancel duplicate shadow orders and trigger restocking
      const shadowOrders = orders.filter(o => o.isDuplicateOrder === true);
      for (const shadow of shadowOrders) {
        await Order.updateOne(
          { _id: shadow._id },
          { $set: { status: "cancelled", cancellationReason: "Merged as duplicate order" } }
        );

        // Restock items of cancelled shadow order
        const restockPromises = (shadow.items || [])
          .map((it) => {
            const prodId = it.product || it.productId;
            if (prodId && it.quantity) {
              return Product.updateOne(
                { _id: prodId },
                { $inc: { stockQuantity: Number(it.quantity) } }
              );
            }
            return null;
          })
          .filter(Boolean);
        if (restockPromises.length) await Promise.all(restockPromises);
      }

      return { success: true, message: "Duplicates merged successfully. Shadow orders cancelled and inventory restocked." };
    } 
    
    if (action === "ignore" || action === "mark_separate") {
      // Unflag all orders in the group, set duplicateStatus to separate_valid or ignored
      const newStatus = action === "ignore" ? "ignored" : "separate_valid";
      await Order.updateMany(
        { duplicateGroupId: parsedGroupId },
        { 
          $set: { 
            isDuplicateOrder: false, 
            duplicateStatus: newStatus
          } 
        }
      );

      return { success: true, message: `Duplicate warnings ignored. Marked all as ${newStatus}.` };
    }

    if (action === "cancel_single") {
      if (!targetOrderId) return { success: false, error: "targetOrderId is required for cancel_single" };
      
      const parsedOrderId = mongoose.Types.ObjectId.isValid(targetOrderId)
        ? new mongoose.Types.ObjectId(targetOrderId)
        : targetOrderId;

      const orderToCancel = orders.find(o => o._id.toString() === targetOrderId.toString());
      if (!orderToCancel) return { success: false, error: "Order not found in duplicate group" };

      // Cancel order, set duplicateStatus to cancelled, trigger restock
      await Order.updateOne(
        { _id: parsedOrderId },
        { 
          $set: { 
            status: "cancelled", 
            duplicateStatus: "cancelled",
            cancellationReason: "Cancelled shadow duplicate"
          } 
        }
      );

      // Restock items
      const restockPromises = (orderToCancel.items || [])
        .map((it) => {
          const prodId = it.product || it.productId;
          if (prodId && it.quantity) {
            return Product.updateOne(
              { _id: prodId },
              { $inc: { stockQuantity: Number(it.quantity) } }
            );
          }
          return null;
        })
        .filter(Boolean);
      if (restockPromises.length) await Promise.all(restockPromises);

      // Check if we have only one remaining active order in group, if so unflag it
      const remainingOrders = await Order.find({ 
        duplicateGroupId: parsedGroupId,
        status: { $nin: ["cancelled", "canceled"] }
      });

      if (remainingOrders.length <= 1) {
        await Order.updateMany(
          { duplicateGroupId: parsedGroupId },
          { $set: { isDuplicateOrder: false, duplicateStatus: "separate_valid" } }
        );
      }

      return { success: true, message: "Shadow duplicate cancelled successfully and inventory restocked." };
    }

    return { success: false, error: "Invalid action type" };
  } catch (err) {
    console.error("[RESOLVE ERROR]", err);
    return { success: false, error: err.message };
  }
}
