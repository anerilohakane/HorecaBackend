import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Claim from "@/lib/db/models/Claim";
import Supplier from "@/lib/db/models/supplier";
import Product from "@/lib/db/models/product";
import * as XLSX from "xlsx";

export async function GET(request) {
  await dbConnect();

  try {
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
      approvalDate: { $gte: startDate, $lte: endDate }
    })
    .populate("vendorId", "businessName email phone")
    .populate("productId", "name sku basePrice assuredMargin categoryId")
    .lean();

    if (!claims || claims.length === 0) {
      return NextResponse.json({ success: false, error: "No approved claims found for this period" }, { status: 404 });
    }

    // Prepare data for Excel
    const reportData = [];
    let totalLoss = 0;

    claims.forEach(claim => {
      const vendor = claim.vendorId || {};
      const product = claim.productId || {};
      
      totalLoss += (claim.lossAmount || 0);

      reportData.push({
        "Vendor Name": vendor.businessName || "N/A",
        "Product Name": product.name || "N/A",
        "Product Code": product.sku || "N/A",
        "SKU": product.sku || "N/A",
        "Base Price": product.basePrice || 0,
        "Assured Margin (%)": product.assuredMargin || 0,
        "Expected Selling Price": claim.expectedSellingPrice || 0,
        "Approved Selling Price": claim.actualSellingPrice || 0,
        "Loss Amount": claim.lossAmount || 0,
        "Approved Date": claim.approvalDate ? new Date(claim.approvalDate).toLocaleDateString() : "N/A"
      });
    });

    // Grouping by Vendor (Optional but requested)
    // For Excel, we usually just sort by vendor or add sub-summaries.
    // Here we'll just sort it to group them visually.
    reportData.sort((a, b) => a["Vendor Name"].localeCompare(b["Vendor Name"]));

    // Summary Section
    const summaryData = [
      ["MONTHLY CLAIM SETTLEMENT REPORT"],
      ["Month", `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`],
      ["Total Approved Products", claims.length],
      ["Total Loss Amount", `₹${totalLoss.toFixed(2)}`],
      [], // Empty row
    ];

    // Generate Excel Buffer
    const workbook = XLSX.utils.book_new();
    
    // Create Summary Sheet
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Append Table Data starting after summary
    XLSX.utils.sheet_add_json(ws, reportData, { origin: "A6" });

    // Set Column Widths
    const wscols = [
      { wch: 30 }, // Vendor Name
      { wch: 30 }, // Product Name
      { wch: 15 }, // Product Code
      { wch: 15 }, // SKU
      { wch: 12 }, // Base Price
      { wch: 15 }, // Assured Margin
      { wch: 20 }, // Expected Price
      { wch: 20 }, // Approved Price
      { wch: 15 }, // Loss Amount
      { wch: 15 }  // Date
    ];
    ws["!cols"] = wscols;

    XLSX.utils.book_append_sheet(workbook, ws, "Monthly Report");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Monthly_Claim_Report_${month}_${year}.xlsx"`
      }
    });

  } catch (err) {
    console.error("Monthly Report Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
