import mongoose from "mongoose";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/order";
import "@/lib/db/models/User";
import "@/lib/db/models/supplier";
import "@/lib/db/models/product";
import "@/lib/db/models/customer";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function safePopulateQuery(query, path, select = "") {
  const registered = mongoose.modelNames();
  function resolveRefForPath(p) {
    const sp = Order.schema.path(p);
    if (!sp) return null;
    if (sp.options && sp.options.ref) return sp.options.ref;
    if (sp.options && sp.options.refPath) return "POLYMORPHIC";
    if (p.includes(".")) {
      const [arrPath, subPath] = p.split(".", 2);
      const arrSchemaPath = Order.schema.path(arrPath);
      if (arrSchemaPath && arrSchemaPath.caster) {
        const casterSchema = arrSchemaPath.caster.schema || arrSchemaPath.caster;
        if (casterSchema && casterSchema.path(subPath) && casterSchema.path(subPath).options) {
           const osp = casterSchema.path(subPath).options;
           if (osp.ref) return osp.ref;
           if (osp.refPath) return "POLYMORPHIC";
        }
      }
    }
    return null;
  }
  const refModel = resolveRefForPath(path);
  if (!refModel) return query;
  if (refModel !== "POLYMORPHIC" && !registered.includes(refModel)) return query;
  return query.populate(path, select);
}

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return json({ success: false, error: "Invalid orderId" }, 400);
    }

    let query = Order.findById(id);
    query = safePopulateQuery(query, "user", "name email phone address city state pincode");
    query = safePopulateQuery(query, "supplier", "name");
    query = safePopulateQuery(query, "items.product", "name price sku isColdStorage");

    let order = await query.lean();

    if (!order) {
      // Fallback: Check if it's a VendorOrder
      const VendorOrder = (await import("@/lib/db/models/VendorOrder")).default;
      let voQuery = VendorOrder.findById(id);
      voQuery = voQuery.populate("user", "name email phone address city state pincode");
      voQuery = voQuery.populate("supplier", "name");
      voQuery = voQuery.populate("items.product", "name price sku isColdStorage");
      
      const vendorOrder = await voQuery.lean();
      if (!vendorOrder) {
        return json({ success: false, error: "Order not found" }, 404);
      }
      
      // Inject orderSource to let the frontend know
      vendorOrder.orderSource = "Vendor";
      return json({ success: true, order: vendorOrder }, 200);
    }

    return json({ success: true, order }, 200);
  } catch (err) {
    console.error("GET /api/order/[id] error:", err);
    return json({ success: false, error: err.message || "Server error" }, 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return json({ success: false, error: "Invalid orderId" }, 400);
    }

    const body = await request.json();
    let order = await Order.findById(id);
    let isVendorOrder = false;

    if (!order) {
      // Fallback: Check if it's a VendorOrder
      const VendorOrder = (await import("@/lib/db/models/VendorOrder")).default;
      order = await VendorOrder.findById(id);
      if (!order) {
        return json({ success: false, error: "Order not found" }, 404);
      }
      isVendorOrder = true;
    }

    // Update order status, invoice, payment, or other properties dynamically
    if (body.status) order.status = body.status;
    if (body.invoice) order.invoice = body.invoice;
    if (body.payment) order.payment = body.payment;
    if (body.cancellationReason !== undefined) order.cancellationReason = body.cancellationReason;
    if (body.cancelledBy !== undefined) order.cancelledBy = body.cancelledBy;
    if (body.departmentNotes !== undefined) order.departmentNotes = body.departmentNotes;
    
    // We can also allow dynamic updates of arbitrary fields if sent
    if (body.shippingAddress) order.shippingAddress = body.shippingAddress;
    if (body.delivery) order.delivery = body.delivery;
    if (body.notes) order.notes = body.notes;

    // Update items if provided
    if (body.items !== undefined) {
      if (Array.isArray(body.items) && body.items.length === 0) {
        order.items = [];
        order.totalAmount = 0;
        order.subtotal = 0;
        order.gstAmount = 0;
        order.total = 0;
        order.status = 'cancelled';
      } else if (Array.isArray(body.items)) {
        order.items = body.items;
        if (body.totalAmount !== undefined) order.totalAmount = body.totalAmount;
        if (body.subtotal !== undefined) order.subtotal = body.subtotal;
        if (body.gstAmount !== undefined) order.gstAmount = body.gstAmount;
        if (body.total !== undefined) order.total = body.total;
        if (body.movDeliveryCharge !== undefined) order.movDeliveryCharge = body.movDeliveryCharge;
        if (body.shippingCharges !== undefined) order.shippingCharges = body.shippingCharges;
      }
      order.markModified("items");
    }

    // Use markModified if needed for mixed types
    if (body.invoice) order.markModified("invoice");
    if (body.payment) order.markModified("payment");

    await order.save();

    // 🔄 AUTOMATIC ACCCOUNT BALANCE REFUND IF ORDER IS CANCELLED OR REJECTED
    const orderStatusLower = (order.status || "").toLowerCase();
    if (orderStatusLower === "cancelled" || orderStatusLower === "canceled" || orderStatusLower === "rejected") {
      try {
        const { refundOrderPaymentIfCancelled } = await import("@/lib/services/duplicateOrderService");
        await refundOrderPaymentIfCancelled(order._id);
      } catch (refundErr) {
        console.error("Failed to auto-refund cancelled/rejected order in PATCH handler:", refundErr);
      }
    }

    // INTERCEPT VENDOR INVOICE SUBMISSION: Update PO timeline only (do not complete yet)
    // Only intercept if it has an orderNumber (which POs have)
    if (body.invoice && body.invoice.invoiceNumber && order.orderNumber) {
      try {
        const poCollection = mongoose.connection.db.collection("purchaseorders");
        const po = await poCollection.findOne({ poNumber: order.orderNumber });
        
        if (po) {
          const alreadyLogged = po.timeline?.some(t => t.message?.includes(body.invoice.invoiceNumber));
          
          if (!alreadyLogged) {
            const newTimeline = {
              status: po.status,
              message: `Invoice #${body.invoice.invoiceNumber} generated by Vendor.`,
              user: "Vendor Portal",
              timestamp: new Date()
            };
            
            await poCollection.updateOne(
              { _id: po._id },
              { 
                $push: { timeline: newTimeline }
              }
            );
          }
        }
      } catch (err) {
        console.error("Error updating PO timeline on vendor invoice:", err);
      }
    }

    // INTERCEPT ORDER CONFIRMATION: Update PO status to In Progress
    if (body.status === "confirmed" && order.orderNumber) {
      try {
        const poCollection = mongoose.connection.db.collection("purchaseorders");
        const po = await poCollection.findOne({ poNumber: order.orderNumber });
        
        if (po && po.status !== "Completed" && po.status !== "In Progress") {
          const newTimeline = {
            status: "In Progress",
            message: "PO Sourcing Accepted & Confirmed. Status changed to In Progress.",
            user: "System",
            timestamp: new Date()
          };

          await poCollection.updateOne(
            { _id: po._id },
            { 
              $set: { status: "In Progress" },
              $push: { timeline: newTimeline }
            }
          );
        }
      } catch (err) {
        console.error("Error updating PO status to In Progress on confirmation:", err);
      }
    }

    return json({ success: true, order }, 200);
  } catch (err) {
    console.error("PATCH /api/order/[id] error:", err);
    return json({ success: false, error: err.message || "Server error" }, 500);
  }
}
