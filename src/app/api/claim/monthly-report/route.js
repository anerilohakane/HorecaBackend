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
    
    if (!vendorId || vendorId === "ALL") {
      return NextResponse.json({ success: false, error: "Please select a specific vendor to generate a template-driven claim report." }, { status: 400 });
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

    query.vendorId = vendorId;

    const claims = await Claim.find(query)
    .populate({
      path: "vendorId",
      select: "businessName email phone ownerName salesPersons claimTemplateId",
      populate: { path: "claimTemplateId" }
    })
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
    const reportData = [];

    // Group rows vendor-wise by sorting
    claims.sort((a, b) => (a.vendorId?.businessName || "").localeCompare(b.vendorId?.businessName || ""));

    claims.forEach(claim => {
      const product = claim.productId || {};
      const vendor = claim.vendorId || {};

      const approvalPerson = claim.salesRepresentativeName 
          ? claim.salesRepresentativeName 
          : (claim.approvedBy && claim.approvedBy !== "SCM Team" 
              ? claim.approvedBy 
              : (vendor.salesPersons && vendor.salesPersons.length > 0 ? vendor.salesPersons[0].name : "N/A"));

      // Create data map for this specific claim
      const dataMap = {
        "Order ID": claim.orderId?.orderNumber || claim.orderId || "N/A",
        "Vendor Name": vendor.businessName || "N/A",
        "Product Name": product.name || "N/A",
        "Product Code": product.sku || "N/A",
        "SKU": product.sku || "N/A",
        "Base Price": product.basePrice || 0,
        "Assured Margin": product.assuredMargin || 0,
        "Actual Selling Price": claim.actualPrice || claim.actualSellingPrice || 0,
        "Expected Selling Price": claim.expectedSellingPrice || 0,
        "Approved Selling Price": claim.actualSellingPrice || 0,
        "Loss Amount": claim.lossAmount || 0,
        "Claim Status": claim.status || "APPROVED",
        "Approved Date": claim.approvalDate 
          ? new Date(claim.approvalDate).toLocaleDateString() 
          : (claim.updatedAt ? new Date(claim.updatedAt).toLocaleDateString() : "N/A"),
        "Approved by(Sales Representative)": approvalPerson,
        "Claim Approval Person": approvalPerson,
        "Approved By": approvalPerson,
        "Sales Representative": approvalPerson
      };

      // Use the vendor's mapped template
      const template = claim.claimTemplateId || vendor.claimTemplateId;
      if (template && template.fields && template.fields.length > 0) {
        const row = {};
        const normalizedMap = {};
        Object.keys(dataMap).forEach(key => normalizedMap[normalize(key)] = dataMap[key]);
        
        template.fields.forEach(field => {
          const normField = normalize(field);
          if (dataMap[field] !== undefined) row[field] = dataMap[field];
          else if (normalizedMap[normField] !== undefined) row[field] = normalizedMap[normField];
          else row[field] = "";
        });
        reportData.push(row);
      } else {
        // Fallback if the vendor has no template mapped
        reportData.push(dataMap);
      }
    });

    if (searchParams.get("format") === "json") {
      return NextResponse.json({ success: true, data: reportData });
    }

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    
    // Auto-size columns dynamically based on headers
    if (reportData.length > 0) {
      const headers = Object.keys(reportData[0]);
      const wscols = headers.map(header => ({ wch: Math.max(header.length + 5, 20) }));
      worksheet["!cols"] = wscols;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");

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
