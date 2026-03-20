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

    // Normalize: strip non-digits
    const numericPhone = phone.replace(/\D/g, "");
    // Standardize: ensure +91 for 10-digit Indian numbers
    const standardizedPhone = (numericPhone.length === 10) ? `+91${numericPhone}` : 
                              (numericPhone.length === 12 && numericPhone.startsWith("91")) ? `+${numericPhone}` :
                              phone.trim();

    // Look for variations to match existing users
    const variations = [phone.trim(), standardizedPhone, numericPhone];
    if (numericPhone.length === 12 && numericPhone.startsWith("91")) {
        variations.push(numericPhone.slice(2)); // handle without 91
    } else if (numericPhone.length === 10) {
        variations.push("91" + numericPhone); // handle with 91
    }

    // Does customer already exist?
    let customer = await Customer.findOne({ phone: { $in: variations } });

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
      phone: standardizedPhone,
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
