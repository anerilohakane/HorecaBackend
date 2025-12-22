import mongoose from "mongoose";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/order";

/* ----------------------------------------
   JSON helper
---------------------------------------- */
const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/* =========================================================
   GET → FETCH INVOICE FOR A SPECIFIC ORDER
   =========================================================
   GET /api/invoice?orderId=xxxx
========================================================= */
export async function GET(request) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId");

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return json({ success: false, error: "Invalid orderId" }, 400);
    }

    const order = await Order.findById(orderId)
      .select("invoice user total currency createdAt")
      .lean();

    if (!order) {
      return json({ success: false, error: "Order not found" }, 404);
    }

    if (!order.invoice) {
      return json(
        { success: false, error: "Invoice not generated for this order" },
        404
      );
    }

    return json({
      success: true,
      invoice: order.invoice,
      orderMeta: {
        orderId: order._id,
        user: order.user,
        total: order.total,
        currency: order.currency,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error("GET /api/invoice error:", err);
    return json({ success: false, error: "Server error" }, 500);
  }
}

/* =========================================================
   POST → GENERATE / REGENERATE INVOICE
   =========================================================
   POST /api/invoice
   Body:
   {
     "orderId": "...",
     "force": true
   }
========================================================= */
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { orderId, force = false } = body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return json({ success: false, error: "Invalid orderId" }, 400);
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return json({ success: false, error: "Order not found" }, 404);
    }

    // Prevent accidental regeneration
    if (order.invoice && !force) {
      return json(
        {
          success: false,
          error: "Invoice already exists. Use force=true to regenerate.",
        },
        409
      );
    }

    const now = new Date();

    const invoiceNumber = `INV-${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${order._id
      .toString()
      .slice(-6)}`;

    order.invoice = {
      invoiceNumber,
      generatedAt: now,
      url: "", // PDF URL will go here later

      meta: {
        orderId: order._id,

        user: order.user,
        supplier: order.supplier || null,

        items: (order.items || []).map((it) => ({
          product: it.product,
          name: it.name,
          sku: it.sku,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
        })),

        subtotal: order.subtotal,
        tax: order.tax,
        shippingCharges: order.shippingCharges,
        discounts: order.discounts,
        total: order.total,
        currency: order.currency || "INR",

        paymentMethod: order.payment?.method || null,
        paymentStatus: order.payment?.status || null,
        transactionId: order.payment?.transactionId || null,
        paidAt: order.payment?.paidAt || null,

        orderStatus: order.status,
        notes: order.notes || "",
        generatedBy: "system",
      },
    };

    await order.save();

    return json({
      success: true,
      message: "Invoice generated successfully",
      invoice: order.invoice,
    });
  } catch (err) {
    console.error("POST /api/invoice error:", err);
    return json({ success: false, error: "Server error" }, 500);
  }
}
