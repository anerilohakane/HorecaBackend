import { NextResponse } from "next/server";
// Monthly Report Generation API
import connectDB from "@/lib/db/connect";
import Claim from "@/lib/db/models/Claim";
import Supplier from "@/lib/db/models/supplier";
import Product from "@/lib/db/models/product";
import * as XLSX from "xlsx";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month")); // 1-12
    const year = parseInt(searchParams.get("year"));

    if (!month || !year) {
      return NextResponse.json({ success: false, error: "Month and Year are required" }, { status: 400 });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const claims = await Claim.find({
      status: "APPROVED",
      $or: [
        { approvalDate: { $gte: startDate, $lte: endDate } },
        { approvalDate: { $exists: false }, updatedAt: { $gte: startDate, $lte: endDate } }
      ]
    })
    .populate("vendorId", "businessName email phone")
    .populate("productId", "name sku basePrice assuredMargin")
    .lean();

    if (!claims || claims.length === 0) {
      return NextResponse.json({ success: false, error: "No approved claims found for this period" }, { status: 404 });
    }

    // Group claims by Vendor
    const vendorGroups = {};
    let totalLoss = 0;

    claims.forEach(claim => {
      const vendorName = claim.vendorId?.businessName || "Unknown Vendor";
      if (!vendorGroups[vendorName]) vendorGroups[vendorName] = [];
      
      const product = claim.productId || {};
      totalLoss += (claim.lossAmount || 0);

      vendorGroups[vendorName].push({
        "Product Name": product.name || "N/A",
        "SKU": product.sku || "N/A",
        "Base Price": product.basePrice || 0,
        "Assured Margin (%)": product.assuredMargin || 0,
        "Expected Selling Price": claim.expectedSellingPrice || 0,
        "Approved Selling Price": claim.actualSellingPrice || 0,
        "Loss Amount": claim.lossAmount || 0,
        "Approved Date": claim.approvalDate 
          ? new Date(claim.approvalDate).toLocaleDateString() 
          : (claim.updatedAt ? new Date(claim.updatedAt).toLocaleDateString() : "N/A")
      });
    });

    // Generate Excel Workbook
    const workbook = XLSX.utils.book_new();

    // 1. Create Global Summary Sheet
    const summaryData = [
      ["MONTHLY VENDOR-WISE CLAIM SETTLEMENT REPORT"],
      ["Month", `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`],
      ["Total Vendors", Object.keys(vendorGroups).length],
      ["Total Approved Products", claims.length],
      ["Total Loss Amount", `₹${totalLoss.toFixed(2)}`],
      [],
      ["Vendor Breakdowns:"],
      ["Vendor Name", "Product Count", "Total Loss"]
    ];

    Object.keys(vendorGroups).forEach(vendorName => {
      const vendorClaims = vendorGroups[vendorName];
      const vendorTotalLoss = vendorClaims.reduce((sum, c) => sum + c["Loss Amount"], 0);
      summaryData.push([vendorName, vendorClaims.length, `₹${vendorTotalLoss.toFixed(2)}`]);
    });

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWs, "Global Summary");

    // 2. Create Individual Vendor Sheets
    Object.keys(vendorGroups).forEach(vendorName => {
      const vendorData = vendorGroups[vendorName];
      // Sheet names must be <= 31 chars
      const sheetName = vendorName.substring(0, 31);
      const ws = XLSX.utils.json_to_sheet(vendorData);
      
      // Auto-size columns
      const wscols = [
        { wch: 35 }, // Product Name
        { wch: 15 }, // SKU
        { wch: 12 }, // Base Price
        { wch: 15 }, // Margin
        { wch: 18 }, // Expected
        { wch: 18 }, // Approved
        { wch: 12 }, // Loss
        { wch: 12 }  // Date
      ];
      ws["!cols"] = wscols;

      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    });

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Monthly_Vendor_Claims_${month}_${year}.xlsx"`
      }
    });
  } catch (err) {
    console.error("Monthly Report Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
