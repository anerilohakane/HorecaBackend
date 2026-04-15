import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import InventoryLoss from "@/lib/db/models/inventory/InventoryLoss";
import { logger } from "@/lib/logger";

// GET - List inventory losses with optional filters and scan mode
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const scan = searchParams.get("scan"); // If "true", run non-moving detection

    // Scan mode: detect non-moving inventory from HorecaBackend products
    if (scan === "true") {
      // In HorecaBackend, we can import Product model directly
      const Product = (await import("@/lib/db/models/product")).default;
      
      try {
        const products = await Product.find({ isActive: true, stockQuantity: { $gt: 0 } }).lean();
        const now = new Date();
        const THRESHOLD_DAYS = 90;
        const nonMovingItems = [];

        for (const product of products) {
          // Use lastSoldAt or updatedAt as proxy for last movement
          const lastMovement = product.lastSoldAt
            ? new Date(product.lastSoldAt)
            : product.updatedAt
            ? new Date(product.updatedAt)
            : new Date(product.createdAt);

          const daysSince = Math.floor(
            (now - lastMovement) / (1000 * 60 * 60 * 24)
          );

          if (daysSince >= THRESHOLD_DAYS) {
            // Check if already detected
            const existing = await InventoryLoss.findOne({
              productId: product._id,
              reason: "Non-Moving",
              status: { $ne: "Written-Off" },
            });

            if (!existing) {
              const loss = await InventoryLoss.create({
                productId: product._id,
                productName: product.name,
                sku: product.sku || "",
                category: product.categoryName || "Uncategorized", // Adjusted based on HorecaBackend Product schema
                reason: "Non-Moving",
                lossQuantity: product.stockQuantity || 0,
                unitPrice: product.price || 0,
                lossValue:
                  (product.stockQuantity || 0) * (product.price || 0),
                lastMovementDate: lastMovement,
                daysSinceMovement: daysSince,
              });
              nonMovingItems.push(loss);
            }
          }
        }

        return NextResponse.json({
          success: true,
          message: `Scan complete. ${nonMovingItems.length} new non-moving items detected.`,
          newDetections: nonMovingItems.length,
          data: nonMovingItems,
        });
      } catch (scanErr) {
        console.error("Scan error:", scanErr);
        return NextResponse.json(
          { success: false, error: "Failed to scan inventory" },
          { status: 500 }
        );
      }
    }

    // Normal fetch mode
    let query = {};
    if (reason) query.reason = reason;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const losses = await InventoryLoss.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate stats
    const allLosses = await InventoryLoss.find({}).lean();
    const stats = {
      total: allLosses.length,
      nonMoving: allLosses.filter((l) => l.reason === "Non-Moving").length,
      totalValue: allLosses.reduce((sum, l) => sum + (l.lossValue || 0), 0),
      writtenOff: allLosses.filter((l) => l.status === "Written-Off").length,
      detected: allLosses.filter((l) => l.status === "Detected").length,
      acknowledged: allLosses.filter((l) => l.status === "Acknowledged").length,
    };

    await logger({
      action: "read",
      message: `Fetched inventory losses (count: ${losses.length})`,
      metadata: { entity: "InventoryLoss", count: losses.length },
      req: request,
    });

    return NextResponse.json({
      success: true,
      data: losses,
      stats,
      count: losses.length,
    });
  } catch (error) {
    console.error("Error in inventory loss GET:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch losses" },
      { status: 500 }
    );
  }
}

// POST - Create or update loss records
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // If updating status (acknowledge or write-off)
    if (body.action && body.lossId) {
      const update = {};
      if (body.action === "acknowledge") {
        update.status = "Acknowledged";
        update.acknowledgedBy = body.user || "Admin";
        update.acknowledgedAt = new Date();
      } else if (body.action === "write-off") {
        update.status = "Written-Off";
        update.writtenOffBy = body.user || "Admin";
        update.writtenOffAt = new Date();
      }
      if (body.notes) update.notes = body.notes;

      const updated = await InventoryLoss.findByIdAndUpdate(
        body.lossId,
        { $set: update },
        { new: true }
      );

      await logger({
        action: "updated",
        message: `${body.action} loss: ${updated?.productName}`,
        metadata: { entity: "InventoryLoss", entityId: updated?.productName },
        req: request,
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // Create new loss record manually
    const loss = await InventoryLoss.create(body);

    await logger({
      action: "created",
      message: `Manually recorded loss: ${loss.productName} (${loss.reason})`,
      metadata: { entity: "InventoryLoss", entityId: loss.productName },
      req: request,
    });

    return NextResponse.json({ success: true, data: loss }, { status: 201 });
  } catch (error) {
    console.error("Error in inventory loss POST:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create/update loss" },
      { status: 500 }
    );
  }
}
