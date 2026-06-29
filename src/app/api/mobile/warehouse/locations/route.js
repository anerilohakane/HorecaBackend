import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import WarehouseLocation from "@/lib/db/models/warehouse/WarehouseLocation";

// GET - List all locations (flat or filtered)
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

    // Validation
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

    // If not a warehouse (root), validate parent
    let parentDoc = null;
    let path = name;
    let ancestors = [];

    if (type !== "WAREHOUSE") {
      if (!parentId) {
        return NextResponse.json(
          { success: false, error: "Parent location is required for non-warehouse types" },
          { status: 400 }
        );
      }

      parentDoc = await WarehouseLocation.findById(parentId);
      if (!parentDoc) {
        return NextResponse.json(
          { success: false, error: "Parent location not found" },
          { status: 404 }
        );
      }

      // Validate hierarchy: parent must allow this type as child
      const allowedChildren = TYPE_HIERARCHY[parentDoc.type]?.allowedChildren || [];
      if (!allowedChildren.includes(type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot add ${type} under ${parentDoc.type}. Allowed children: ${allowedChildren.join(", ") || "none"}`,
          },
          { status: 400 }
        );
      }

      // Build path and ancestors
      path = parentDoc.path ? `${parentDoc.path} → ${name}` : `${parentDoc.name} → ${name}`;
      ancestors = [...(parentDoc.ancestors || []), parentDoc._id];
    }

    const newLocation = await WarehouseLocation.create({
      name,
      type,
      level,
      parentId: parentId || null,
      path,
      ancestors,
      capacity: capacity || 0,
      description: description || "",
      status: status || "active",
    });

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
