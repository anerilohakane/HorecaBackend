import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import VendorOrder from "@/lib/db/models/VendorOrder";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId"); // The vendor/supplier ID
    const supplierId = searchParams.get("supplierId");
    
    let query = {};
    if (userId) {
      query.supplier = userId;
    } else if (supplierId) {
      query.supplier = supplierId;
    }

    const orders = await VendorOrder.find(query).sort({ createdAt: -1 }).lean();

    // Populate user and supplier info if needed, but for venderside basic lean is often enough
    // if venderside expects `orders` wrapper, we can return that.
    return NextResponse.json({ success: true, orders, data: orders });
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const newVendorOrder = new VendorOrder(body);
    await newVendorOrder.save();
    
    return NextResponse.json({ success: true, data: newVendorOrder }, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor order:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, status, paymentStatus } = body;

    const order = await VendorOrder.findById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Check if status is transitioning to delivered
    const isBecomingDelivered = status === "delivered" && order.status !== "delivered";

    if (status) order.status = status;
    if (paymentStatus) {
      if (!order.payment) order.payment = {};
      order.payment.status = paymentStatus;
    }

    await order.save();

    // If order is delivered, add to Open Storage and Inventory
    if (isBecomingDelivered) {
      try {
        const openStoragesCol = mongoose.connection.db.collection('openstorages');
        const inventoryCol = mongoose.connection.db.collection('inventories');
        const supplierDoc = await mongoose.connection.db.collection('suppliers').findOne({ _id: order.supplier });

        for (const item of order.items || []) {
          // 1. Add to Open Storage
          const openStorageEntry = {
            productId: item.product.toString(),
            productName: item.name,
            sku: item.sku || "",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            supplier: {
              id: order.supplier.toString(),
              name: supplierDoc?.name || "Vendor",
            },
            poNumber: order.orderNumber,
            status: "Available",
            receivedDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await openStoragesCol.insertOne(openStorageEntry);

          // 2. Update Inventory
          const existingInventory = await inventoryCol.findOne({ productId: item.product.toString() });
          if (existingInventory) {
            await inventoryCol.updateOne(
              { _id: existingInventory._id },
              { 
                $inc: { 
                  currentStock: item.quantity, 
                  stockQuantity: item.quantity 
                },
                $set: { lastMovementDate: new Date(), updatedAt: new Date() }
              }
            );
          } else {
            await inventoryCol.insertOne({
              productId: item.product.toString(),
              productName: item.name,
              currentStock: item.quantity,
              stockQuantity: item.quantity,
              lastMovementDate: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      } catch (err) {
        console.error("Error updating OpenStorage/Inventory on Vendor Order delivery:", err);
      }
    }
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Error updating vendor order:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
