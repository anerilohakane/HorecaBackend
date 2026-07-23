import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Customer from "@/lib/db/models/customer";

export async function PUT(req) {
  await dbConnect();

  try {
    const body = await req.json();
    const { id, name, email, address, city, state, pincode, lat, lng, advanceBalance, addAdvanceBalance } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (address !== undefined) updateFields.address = address;
    if (city !== undefined) updateFields.city = city;
    if (state !== undefined) updateFields.state = state;
    if (pincode !== undefined) updateFields.pincode = pincode;
    if (lat !== undefined) updateFields.lat = lat;
    if (lng !== undefined) updateFields.lng = lng;
    if (typeof advanceBalance === 'number') updateFields.advanceBalance = advanceBalance;

    if (typeof addAdvanceBalance === 'number' && addAdvanceBalance > 0) {
      const customer = await Customer.findById(id);
      if (customer) {
        updateFields.advanceBalance = (customer.advanceBalance || 0) + addAdvanceBalance;
      }
    }

    const updated = await Customer.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("PUT /api/customers/update error", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
