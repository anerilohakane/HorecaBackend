import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Supplier from "@/lib/db/models/supplier";

const TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST(request, { params }) {
  await dbConnect();

  try {
    const { id } = await params;
    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ success: false, error: "Both old and new passwords are required" }, { status: 400 });
    }

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });
    }

    // Verify old password
    const isMatched = await supplier.isPasswordCorrect(oldPassword);
    if (!isMatched) {
      return NextResponse.json({ success: false, error: "Incorrect current password" }, { status: 401 });
    }

    // Update password (pre-save hook will hash it)
    supplier.password = newPassword;
    await supplier.save();

    // Generate new token to keep user logged in
    const token = supplier.generateAccessToken();

    // Set Cookie
    const cookie = `authToken=${token}; Path=/; HttpOnly; Max-Age=${TOKEN_MAX_AGE}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

    return NextResponse.json(
      { success: true, message: "Password updated successfully", token },
      { 
        status: 200,
        headers: { "Set-Cookie": cookie }
      }
    );

  } catch (err) {
    console.error("Change Password Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
