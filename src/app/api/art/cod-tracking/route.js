import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Order from "@/lib/db/models/Order";

export async function GET(request) {
  try {
    await connectDB();

    // Fetch all COD orders that are not yet fully paid
    // payment.method could be "cod", "COD"
    const pendingOrders = await Order.find({
      "payment.method": { $regex: /^cod$/i },
      "payment.status": { $ne: "paid" }
    })
    .populate("user", "name businessName phone email")
    .sort({ createdAt: -1 });

    // Aggregate metrics and customer groupings
    let totalPendingAmount = 0;
    const customerMap = {};

    pendingOrders.forEach(order => {
      // Calculate order total
      let orderTotal = 0;
      if (order.items && order.items.length > 0) {
        orderTotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
      }
      
      totalPendingAmount += orderTotal;

      if (order.user) {
        const customerId = order.user._id.toString();
        if (!customerMap[customerId]) {
          customerMap[customerId] = {
            customer: order.user,
            totalOutstanding: 0,
            orderCount: 0,
            orders: []
          };
        }
        customerMap[customerId].totalOutstanding += orderTotal;
        customerMap[customerId].orderCount += 1;
        customerMap[customerId].orders.push({
          _id: order._id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          amount: orderTotal,
          deliveryStatus: order.delivery?.status || "pending"
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalPendingAmount,
          totalPendingOrders: pendingOrders.length,
          totalCustomers: Object.keys(customerMap).length
        },
        customers: Object.values(customerMap).sort((a, b) => b.totalOutstanding - a.totalOutstanding),
        pendingOrders: pendingOrders.map(order => ({
          _id: order._id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          amount: order.items ? order.items.reduce((sum, item) => sum + item.totalPrice, 0) : 0,
          customer: order.user,
          deliveryStatus: order.delivery?.status || "pending",
          paymentStatus: order.payment?.status || "pending"
        }))
      }
    });

  } catch (error) {
    console.error("Error fetching COD tracking data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch COD tracking data" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { orderId, action, transactionId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing order ID" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (action === "MARK_PAID") {
      if (!order.payment) order.payment = {};
      order.payment.status = "paid";
      order.payment.paidAt = new Date();
      order.payment.transactionId = transactionId || "CASH_COLLECTED_ART";
      order.payment.paidAmount = order.items ? order.items.reduce((sum, item) => sum + item.totalPrice, 0) : 0;
      
      await order.save();

      return NextResponse.json({
        success: true,
        message: "Order marked as paid successfully",
        data: order
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error updating COD payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update payment status" },
      { status: 500 }
    );
  }
}
