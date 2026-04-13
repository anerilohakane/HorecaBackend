import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import WarehouseLocation from "@/lib/db/models/warehouse/WarehouseLocation";
import { logger } from "@/lib/logger";

// GET - Get a single location with its children
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const location = await WarehouseLocation.findById(id).lean();
    if (!location) {
      return NextResponse.json(
        { success: false, error: "Location not found" },
        { status: 404 }
      );
    }

    // Get immediate children
    const children = await WarehouseLocation.find({ parentId: id })
      .sort({ name: 1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: { ...location, children },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in location GET API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch location" },
      { status: 500 }
    );
  }
}

// PUT - Update a location
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const { name, capacity, status, description } = body;

    const existing = await WarehouseLocation.findById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Location not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updatedLocation = await WarehouseLocation.findById(id);
    if (name) updatedLocation.name = name;
    if (capacity !== undefined) updatedLocation.capacity = capacity;
    if (status) updatedLocation.status = status;
    if (description !== undefined) updatedLocation.description = description;
    
    await updatedLocation.save();

    // If name changed, we also need to update all descendants because the path has changed
    if (name && name !== existing.name) {
      const descendants = await WarehouseLocation.find({ ancestors: id });
      for (const desc of descendants) {
        await desc.save();
      }
    }

    // Activity Logging
    try {
      await logger({
        level: 'info',
        message: `Warehouse Location Updated: ${updatedLocation.name}`,
        action: 'WAREHOUSE_LOCATION_UPDATE',
        metadata: { id: updatedLocation._id, name: updatedLocation.name, type: updatedLocation.type },
        req: request
      });
    } catch (logErr) {
      console.error("Logging error:", logErr.message);
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedLocation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in location PUT API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update location" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a location and all its descendants
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const location = await WarehouseLocation.findById(id);
    if (!location) {
      return NextResponse.json(
        { success: false, error: "Location not found" },
        { status: 404 }
      );
    }

    const descendants = await WarehouseLocation.find({ ancestors: id });
    const descendantIds = descendants.map((d) => d._id);
    const allIdsToDelete = [location._id, ...descendantIds];
    
    const result = await WarehouseLocation.deleteMany({
      _id: { $in: allIdsToDelete },
    });

    // Activity Logging
    try {
      await logger({
        level: 'warn',
        message: `Warehouse Location Deleted: ${location.name} (${result.deletedCount} nodes)`,
        action: 'WAREHOUSE_LOCATION_DELETE',
        metadata: { id: location._id, name: location.name, deletedCount: result.deletedCount },
        req: request
      });
    } catch (logErr) {
      console.error("Logging error:", logErr.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Deleted ${result.deletedCount} location(s) including descendants`,
        deletedCount: result.deletedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in location DELETE API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete location" },
      { status: 500 }
    );
  }
}
