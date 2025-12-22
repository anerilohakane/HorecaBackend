import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Customer from "@/lib/db/models/customer";

export async function POST(request) {
  console.log("🔥 HIT /api/customers/create");

  try {
    await dbConnect();
    console.log("🟢 MongoDB Connected");

    const body = await request.json().catch(() => ({}));
    console.log("📩 Request Body:", body);

    const { phone, name, email, address, city, state, pincode } = body;

    if (!phone) {
      console.log("❌ Missing phone");
      return NextResponse.json(
        { success: false, error: "Phone is required" },
        { status: 400 }
      );
    }

    console.log("➡️ Phone:", phone);

    // Does customer already exist?
    let customer = await Customer.findOne({ phone });

    if (customer) {
      console.log("🟡 Existing customer found:", customer._id);

      // Update lastLoginAt
      customer.lastLoginAt = new Date();
      await customer.save();

      return NextResponse.json({
        success: true,
        message: "Customer already exists. Returning record.",
        data: customer,
      });
    }

    // Create new customer
    console.log("🆕 Creating new customer…");

    const newCustomer = await Customer.create({
      phone,
      name: name ?? null,
      email: email ?? null,
      address: address ?? null,
      city: city ?? null,
      state: state ?? null,
      pincode: pincode ?? null,
      lastLoginAt: new Date(),
    });

    console.log("🟢 Customer Created:", newCustomer._id);

    return NextResponse.json({
      success: true,
      message: "Customer created successfully",
      data: newCustomer,
    });
  } catch (err) {
    console.error("❌ ERROR in /api/customers/create:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
