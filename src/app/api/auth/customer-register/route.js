import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db/connect";
import Customer from "@/lib/db/models/customer";
import { logger } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      username, password, email, phone, businessName, gstNumber,
      licenseImage, name, locations, supplierId, category
    } = body;

    if (!username || username.length < 3) {
      return NextResponse.json({ success: false, error: "Username must be at least 3 characters" }, { status: 400 });
    }

    if (!category || !['A', 'B', 'C'].includes(category)) {
      return NextResponse.json({ success: false, error: "Valid customer tier (A, B, C) is required" }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 });
    }

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ success: false, error: "Invalid phone number" }, { status: 400 });
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: "Full name is required" }, { status: 400 });
    }

    if (!businessName || businessName.trim().length < 2) {
      return NextResponse.json({ success: false, error: "Business name is required" }, { status: 400 });
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstNumber || !gstRegex.test(gstNumber.toUpperCase())) {
      return NextResponse.json({ success: false, error: "Valid GST number is required" }, { status: 400 });
    }

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json({ success: false, error: "At least one business location is required" }, { status: 400 });
    }

    // Validate the first location at least
    const primaryLocation = locations[0];
    if (!primaryLocation.address || primaryLocation.address.trim().length < 5) {
      return NextResponse.json({ success: false, error: "Valid business address is required" }, { status: 400 });
    }
    if (!primaryLocation.city || primaryLocation.city.trim().length < 2) {
      return NextResponse.json({ success: false, error: "City is required" }, { status: 400 });
    }
    if (!primaryLocation.state || primaryLocation.state.trim().length < 2) {
      return NextResponse.json({ success: false, error: "State is required" }, { status: 400 });
    }
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!primaryLocation.pincode || !pinRegex.test(primaryLocation.pincode)) {
      return NextResponse.json({ success: false, error: "Valid 6-digit PIN code is required" }, { status: 400 });
    }

    // Ensure all locations are valid and structured
    const formattedLocations = locations.map((loc, index) => ({
      address: loc.address?.trim() || "",
      city: loc.city?.trim() || "",
      state: loc.state?.trim() || "",
      pincode: loc.pincode?.trim() || "",
      lat: loc.lat || null,
      lng: loc.lng || null,
      isPrimary: index === 0
    }));

    if (!licenseImage) {
      return NextResponse.json({ success: false, error: "Business license image is required" }, { status: 400 });
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await Customer.findOne({
      $or: [{ username }, { email }, { phone }]
    });

    if (existingUser) {
      let conflictField = "User";
      if (existingUser.username === username) conflictField = "Username";
      else if (existingUser.email === email) conflictField = "Email";
      else if (existingUser.phone === phone) conflictField = "Phone number";

      return NextResponse.json({ success: false, error: `${conflictField} already exists` }, { status: 409 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Normalize Phone
    const numericPhone = phone.replace(/\D/g, "");
    const standardizedPhone = (numericPhone.length === 10) ? `+91${numericPhone}` :
      (numericPhone.length === 12 && numericPhone.startsWith("91")) ? `+${numericPhone}` :
        phone.trim();

    // Create user
    const newUser = await Customer.create({
      username,
      password: hashedPassword,
      email: email.toLowerCase(),
      phone: standardizedPhone,
      name: name.trim(),
      address: primaryLocation.address.trim(),
      city: primaryLocation.city || null,
      state: primaryLocation.state || null,
      pincode: primaryLocation.pincode || null,
      locations: formattedLocations,
      businessName: businessName.trim(),
      gstNumber: gstNumber || null,
      licenseImage,
      category,
      supplierId: supplierId || null,
      lastLoginAt: new Date()
    });

    await logger({
      level: 'info',
      message: `New customer registered: ${newUser.username}`,
      action: 'CUSTOMER_REGISTERED',
      userId: newUser._id,
      userModel: 'Customer',
      metadata: { username, email },
      req
    });

    // Create JWT
    const token = jwt.sign(
      { _id: newUser._id, phone: newUser.phone, category: newUser.category, username: newUser.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      data: {
        accessToken: token,
        user: {
          id: newUser._id,
          username: newUser.username,
          phone: newUser.phone,
          email: newUser.email,
          name: newUser.name,
          businessName: newUser.businessName,
          category: newUser.category
        },
      },
    });
  } catch (err) {
    console.error("🔥 CUSTOMER REGISTRATION ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
