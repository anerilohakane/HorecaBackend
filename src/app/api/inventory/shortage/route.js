import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import GoodsReceivedNote from "@/lib/db/models/inventory/GoodsReceivedNote";
import PurchaseOrder from "@/lib/db/models/inventory/PurchaseOrder";
import { logger } from "@/lib/logger";

// GET - Shortage analytics report
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const supplier = searchParams.get("supplier");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Get all GRNs with shortages
    let grnQuery = { hasShortage: true };
    if (supplier)
      grnQuery["supplier.name"] = { $regex: supplier, $options: "i" };
    if (dateFrom || dateTo) {
      grnQuery.createdAt = {};
      if (dateFrom) grnQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) grnQuery.createdAt.$lte = new Date(dateTo);
    }

    const shortageGRNs = await GoodsReceivedNote.find(grnQuery)
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate shortage by supplier
    const supplierShortages = {};
    const productShortages = {};

    shortageGRNs.forEach((grn) => {
      const supplierName = grn.supplier?.name || "Unknown";
      if (!supplierShortages[supplierName]) {
        supplierShortages[supplierName] = {
          name: supplierName,
          totalShortage: 0,
          totalValue: 0,
          grnCount: 0,
        };
      }
      supplierShortages[supplierName].totalShortage += grn.totalShortage || 0;
      supplierShortages[supplierName].totalValue +=
        grn.totalShortageValue || 0;
      supplierShortages[supplierName].grnCount += 1;

      // Product-level aggregation
      grn.items?.forEach((item) => {
        if (item.shortageQty > 0) {
          const key = item.productId;
          if (!productShortages[key]) {
            productShortages[key] = {
              productId: item.productId,
              productName: item.productName,
              sku: item.sku,
              totalShortage: 0,
              totalValue: 0,
              occurrences: 0,
            };
          }
          productShortages[key].totalShortage += item.shortageQty;
          productShortages[key].totalValue += item.shortageValue || 0;
          productShortages[key].occurrences += 1;
        }
      });
    });

    // Overall stats
    const totalPOs = await PurchaseOrder.countDocuments();
    const pendingGRNs = await PurchaseOrder.countDocuments({
      status: { $in: ["Sent", "Partially Received"] },
    });

    const stats = {
      totalPOs,
      pendingGRNs,
      totalShortageGRNs: shortageGRNs.length,
      totalShortageValue: shortageGRNs.reduce(
        (sum, g) => sum + (g.totalShortageValue || 0),
        0
      ),
      totalShortageQty: shortageGRNs.reduce(
        (sum, g) => sum + (g.totalShortage || 0),
        0
      ),
    };

    await logger({
      action: "read",
      message: `Generated shortage report`,
      metadata: { entity: "ShortageReport" },
      req: request,
    });

    return NextResponse.json({
      success: true,
      stats,
      bySupplier: Object.values(supplierShortages).sort(
        (a, b) => b.totalValue - a.totalValue
      ),
      byProduct: Object.values(productShortages).sort(
        (a, b) => b.totalShortage - a.totalShortage
      ),
      shortageGRNs,
    });
  } catch (error) {
    console.error("Error in shortage GET:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate shortage report",
      },
      { status: 500 }
    );
  }
}
