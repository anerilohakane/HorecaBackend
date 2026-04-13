import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import WarehouseLocation from "@/lib/db/models/warehouse/WarehouseLocation";
import { logger } from "@/lib/logger";

// GET - List all locations
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const parentId = searchParams.get("parentId");
    const status = searchParams.get("status");

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ];
    }
    if (type) query.type = type;
    if (parentId) query.parentId = parentId;
    if (status) query.status = status;

    const locations = await WarehouseLocation.find(query)
      .sort({ level: 1, name: 1 })
      .lean();

    // Compute summary stats
    const allLocations = await WarehouseLocation.find({}).lean();
    const stats = {
      totalWarehouses: allLocations.filter((l) => l.type === "WAREHOUSE").length,
      totalBlocks: allLocations.filter((l) => l.type === "BLOCK").length,
      totalRacks: allLocations.filter((l) => l.type === "RACK").length,
      totalShelves: allLocations.filter((l) => l.type === "SHELF").length,
      totalBins: allLocations.filter((l) => l.type === "BIN").length,
      totalLocations: allLocations.length,
      activeLocations: allLocations.filter((l) => l.status === "active").length,
      totalCapacity: allLocations
        .filter((l) => l.type === "BIN")
        .reduce((sum, l) => sum + (l.capacity || 0), 0),
      usedCapacity: allLocations
        .filter((l) => l.type === "BIN")
        .reduce((sum, l) => sum + (l.currentQuantity || 0), 0),
    };

    return NextResponse.json(
      {
        success: true,
        data: locations,
        stats,
        count: locations.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in warehouse locations GET API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch locations",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new location
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { name, type, parentId, capacity, description, status } = body;

    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: "Name and type are required" },
        { status: 400 }
      );
    }

    const TYPE_HIERARCHY = WarehouseLocation.TYPE_HIERARCHY;
    if (!TYPE_HIERARCHY[type]) {
      return NextResponse.json(
        { success: false, error: `Invalid location type: ${type}` },
        { status: 400 }
      );
    }

    const level = TYPE_HIERARCHY[type].level;

    // Hierarchy validation for non-warehouse types
    if (type !== "WAREHOUSE") {
      if (!parentId) {
        return NextResponse.json(
          { success: false, error: "Parent location is required for non-warehouse types" },
          { status: 400 }
        );
      }

      const parentDoc = await WarehouseLocation.findById(parentId);
      if (!parentDoc) {
        return NextResponse.json(
          { success: false, error: "Parent location not found" },
          { status: 404 }
        );
      }

      const allowedChildren = TYPE_HIERARCHY[parentDoc.type]?.allowedChildren || [];
      if (!allowedChildren.includes(type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot add ${type} under ${parentDoc.type}. Allowed children: ${allowedChildren.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    const newLocation = await WarehouseLocation.create({
      name,
      type,
      level,
      parentId: parentId || null,
      capacity: capacity || 0,
      description: description || "",
      status: status || "active",
    });

    // Activity Logging
    try {
      await logger({
        level: 'info',
        message: `Warehouse Location Created: ${newLocation.name} (${newLocation.type})`,
        action: 'WAREHOUSE_LOCATION_CREATE',
        metadata: { 
          id: newLocation._id, 
          name: newLocation.name, 
          type: newLocation.type,
          path: newLocation.path 
        },
        req: request
      });
    } catch (logErr) {
      console.error("Logging error:", logErr.message);
    }

    return NextResponse.json(
      {
        success: true,
        data: newLocation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in warehouse locations POST API:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "A location with this barcode already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create location",
      },
      { status: 500 }
    );
  }
}
