import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import WarehouseLocation from "@/lib/db/models/warehouse/WarehouseLocation";

// GET - Build and return the full nested tree structure
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId"); // Optional: filter to specific warehouse

    // Fetch all locations
    let query = {};
    if (warehouseId) {
      query.$or = [
        { _id: warehouseId },
        { ancestors: warehouseId },
      ];
    }

    const allLocations = await WarehouseLocation.find(query)
      .sort({ level: 1, name: 1 })
      .lean();

    // Build tree from flat list
    const locationMap = new Map();
    const roots = [];

    // First pass: create map entries
    allLocations.forEach((loc) => {
      locationMap.set(loc._id.toString(), {
        ...loc,
        _id: loc._id.toString(),
        parentId: loc.parentId?.toString() || null,
        children: [],
      });
    });

    // Second pass: link children to parents
    allLocations.forEach((loc) => {
      const node = locationMap.get(loc._id.toString());
      if (loc.parentId) {
        const parent = locationMap.get(loc.parentId.toString());
        if (parent) {
          parent.children.push(node);
        } else {
          // Orphan: parent not in result set, treat as root
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Compute stats
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
        data: roots,
        stats,
        totalNodes: allLocations.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in warehouse tree GET API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to build location tree",
      },
      { status: 500 }
    );
  }
}
