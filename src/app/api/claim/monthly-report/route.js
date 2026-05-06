import { NextResponse } from "next/server";
// Monthly Report Generation API
import connectDB from "@/lib/db/connect";
import Claim from "@/lib/db/models/Claim";
import Supplier from "@/lib/db/models/supplier";
import Product from "@/lib/db/models/product";
import ClaimTemplate from "@/lib/db/models/ClaimTemplate";
import * as XLSX from "xlsx";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month")); // 1-12
    const year = parseInt(searchParams.get("year"));
    const vendorId = searchParams.get("vendorId");

    if (!month || !year) {
      return NextResponse.json({ success: false, error: "Month and Year are required" }, { status: 400 });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const query = {
      status: "APPROVED",
      $or: [
        { approvalDate: { $gte: startDate, $lte: endDate } },
        { approvalDate: { $exists: false }, updatedAt: { $gte: startDate, $lte: endDate } }
      ]
    };

    if (vendorId && vendorId !== "ALL") {
      query.vendorId = vendorId;
    }

    const claims = await Claim.find(query)
    .populate("vendorId", "businessName email phone")
    .populate("productId", "name sku basePrice assuredMargin categoryId unit")
    .populate("claimTemplateId")
    .lean();

    if (!claims || claims.length === 0) {
      return NextResponse.json({ success: false, error: "No approved claims found for this period" }, { status: 404 });
    }

    // Comprehensive Mapping helper (same as generate/route.js)
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Prepare data for Excel
    const workbook = XLSX.utils.book_new();
    const vendorGroups = {};
    let totalLoss = 0;

    claims.forEach(claim => {
      const vendorName = claim.vendorId?.businessName || "Unknown Vendor";
      if (!vendorGroups[vendorName]) vendorGroups[vendorName] = [];
      
      const product = claim.productId || {};
      const vendor = claim.vendorId || {};
      totalLoss += (claim.lossAmount || 0);

      // Create data map for this specific claim
      const dataMap = {
        "Product Name": product.name,
        "Product Code": product.sku,
        "SKU": product.sku,
        "Item Name": product.name,
        "Base Price": product.basePrice,
        "Margin (%)": product.assuredMargin,
        "Assured Margin": product.assuredMargin,
        "Assurred Margin": product.assuredMargin,
        "Margin": product.assuredMargin,
        "Expected Price": claim.expectedSellingPrice,
        "Expected Selling Price": claim.expectedSellingPrice,
        "Actual Price": claim.actualSellingPrice,
        "Actual Selling Price": claim.actualSellingPrice,
        "Loss Amount": claim.lossAmount,
        "Amount": claim.lossAmount,
        "Claim ID": claim.claimId,
        "Vendor Name": vendor.businessName,
        "Vendor": vendor.businessName,
        "Vendor Email": vendor.email,
        "Vendor Phone": vendor.phone,
        "Requested Price": claim.requestedPrice,
        "Approved Date": claim.approvalDate 
          ? new Date(claim.approvalDate).toLocaleDateString() 
          : (claim.updatedAt ? new Date(claim.updatedAt).toLocaleDateString() : "N/A"),
        "Status": claim.status,
        "Category": product.categoryId?.name || "",
        "Unit": product.unit || ""
      };

      const normalizedMap = {};
      Object.keys(dataMap).forEach(key => {
        normalizedMap[normalize(key)] = dataMap[key];
      });

      // Use template fields if available
      const template = claim.claimTemplateId;
      let finalRow = {};

      if (template && template.fields && template.fields.length > 0) {
        template.fields.forEach(field => {
          const normField = normalize(field);
          if (dataMap[field] !== undefined) {
            finalRow[field] = dataMap[field];
          } else if (normalizedMap[normField] !== undefined) {
            finalRow[field] = normalizedMap[normField];
          } else {
            finalRow[field] = "";
          }
        });
      } else {
        // Fallback to standard set
        finalRow = {
          "Product Name": product.name || "N/A",
          "SKU": product.sku || "N/A",
          "Base Price": product.basePrice || 0,
          "Assured Margin (%)": product.assuredMargin || 0,
          "Expected Selling Price": claim.expectedSellingPrice || 0,
          "Approved Selling Price": claim.actualSellingPrice || 0,
          "Loss Amount": claim.lossAmount || 0,
          "Approved Date": dataMap["Approved Date"]
        };
      }

      vendorGroups[vendorName].push(finalRow);
    });

    // 1. Global Summary Sheet
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
      const vendorTotalLoss = vendorClaims.reduce((sum, c) => sum + (c["Loss Amount"] || c["Amount"] || 0), 0);
      summaryData.push([vendorName, vendorClaims.length, `₹${vendorTotalLoss.toFixed(2)}`]);
    });

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), "Global Summary");

    // 2. Vendor Specific Sheets
    Object.keys(vendorGroups).forEach(vendorName => {
      const vendorData = vendorGroups[vendorName];
      const sheetName = vendorName.substring(0, 31);
      const ws = XLSX.utils.json_to_sheet(vendorData);
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
