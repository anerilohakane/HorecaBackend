import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import PriceNegotiation from "@/lib/db/models/PriceNegotiation";
import Order from "@/lib/db/models/order";
import Product from "@/lib/db/models/product";
import Customer from "@/lib/db/models/customer";
import Department from "@/lib/db/models/Department";

export async function POST(request, { params }) {
  await dbConnect();
  try {
    const { id } = await params;
    const body = await request.json();
    const { salesRepresentativeId } = body;

    const priceRequest = await PriceNegotiation.findById(id);
    if (!priceRequest) {
      return NextResponse.json({ success: false, error: "Price request not found" }, { status: 404 });
    }

    if (priceRequest.status !== "pending") {
      return NextResponse.json({ success: false, error: "Only pending requests can be approved" }, { status: 400 });
    }

    // Update status to approved and closed
    priceRequest.status = "approved";
    if (salesRepresentativeId) {
      priceRequest.salesRepresentative = salesRepresentativeId;
    }

    // Generate Order automatically
    const product = await Product.findById(priceRequest.productId);
    
    // Check Customer collection first, then User collection
    let customer = await Customer.findById(priceRequest.customerId);
    let userModel = "Customer";
    if (!customer) {
      const User = (await import("@/lib/db/models/User")).default || (await import("@/lib/db/models/User"));
      customer = await User.findById(priceRequest.customerId);
      userModel = "User";
    }
    
    let orderDoc = null;
    
    if (product && customer) {
      // Find ODT department
      let odtDeptId = null;
      const odtDept = await Department.findOne({ departmentName: { $regex: /^odt$/i } });
      if (odtDept) {
        odtDeptId = odtDept._id;
      }

      const orderNumber = `ORD-${Date.now()}`;
      const qty = priceRequest.quantity || 1;
      const unitPrice = priceRequest.requestedPrice;
      const totalPrice = unitPrice * qty;
      const gstPercent = product.gst || 0;
      const gstAmount = (totalPrice * gstPercent) / 100;
      const grandTotal = totalPrice + gstAmount;

      orderDoc = new Order({
        orderNumber,
        user: customer._id,
        userModel: userModel,
        items: [{
          product: product._id,
          name: product.name,
          sku: product.sku || String(product._id),
          quantity: qty,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          gst: gstPercent,
          image: product.image || null,
        }],
        shippingAddress: {
          fullName: customer.name || customer.username || "Customer",
          phone: customer.phone || "",
          email: customer.email || "",
        },
        subtotal: totalPrice,
        gst: gstPercent,
        gstAmount: Number(gstAmount.toFixed(2)),
        total: Number(grandTotal.toFixed(2)),
        status: "pending",
        department: odtDeptId || "odt",
        payment: {
          method: "cod",
          status: "pending"
        },
        placedAt: new Date()
      });

      await orderDoc.save();
    }

    await priceRequest.save();

    return NextResponse.json({ 
      success: true, 
      data: priceRequest,
      orderId: orderDoc ? orderDoc._id : null
    });
  } catch (err) {
    console.error("POST /api/price-requests/[id]/approve error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
