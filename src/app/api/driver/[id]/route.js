// src/app/api/driver/[id]/route.js
import { NextResponse } from "next/server";
import Order from "@/lib/db/models/order";
import connectToDatabase from "@/lib/db/connect";

export async function PATCH(req, { params }) {
  try {
    const { id: orderId } = await params;
    
    // Connect to DB
    await connectToDatabase();

    // Parse body: { lat, lng, bearing }
    const { lat, lng, bearing } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID required" },
        { status: 400 }
      );
    }

    // Update the Order with new location
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          driverLocation: {
            lat,
            lng,
            bearing: bearing || 0,
            lastUpdated: new Date()
          }
        }
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder.driverLocation
    });

  } catch (error) {
    console.error("Failed to update driver location:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
