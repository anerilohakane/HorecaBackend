import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Claim from "@/lib/db/models/Claim";
import Product from "@/lib/db/models/product";
import Supplier from "@/lib/db/models/supplier";
import ClaimTemplate from "@/lib/db/models/ClaimTemplate";
import * as XLSX from "xlsx";
import { v2 as cloudinary } from "cloudinary";
import { sendEmail } from "@/lib/mail";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req) {
  try {
    await connectDB();
    const { claimId } = await req.json();

    const claim = await Claim.findOne({ claimId }).populate("vendorId").populate("productId").populate("claimTemplateId");
    if (!claim) {
      return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });
    }

    if (claim.status !== "APPROVED" && claim.status !== "RAISED") {
      return NextResponse.json({ success: false, error: "Claim must be approved before generation" }, { status: 400 });
    }

    const product = claim.productId;
    const vendor = claim.vendorId;

    // Prepare data for Excel
    const data = [{
      "Product Name": product.name,
      "Product Code": product.sku,
      "SKU": product.sku,
      "Base Price": product.basePrice,
      "Margin (%)": product.assuredMargin,
      "Expected Selling Price": claim.expectedSellingPrice.toFixed(2),
      "Actual Selling Price": claim.actualSellingPrice.toFixed(2),
      "Loss Amount": claim.lossAmount.toFixed(2),
      "Claim ID": claim.claimId,
      "Vendor": vendor.businessName,
      "Date": new Date().toLocaleDateString()
    }];

    // Generate Excel Buffer
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Claim Data");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "claims",
          resource_type: "auto",
          public_id: claim.claimId
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    claim.fileUrl = uploadResult.secure_url;
    claim.status = "APPROVED"; // User requested to use APPROVED status
    await claim.save();

    // Send email to Vendor Sales Person
    const salesPerson = vendor.salesPersons && vendor.salesPersons.length > 0 ? vendor.salesPersons[0] : null;
    if (salesPerson && salesPerson.email) {
        await sendEmail({
            to: salesPerson.email,
            subject: `Claim Approved: ${claim.claimId} - ${product.name}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #059669;">Claim Approved</h2>
                <p>The following claim has been approved and processed.</p>
                <p><strong>Claim ID:</strong> ${claim.claimId}</p>
                <p><strong>Total Loss Amount:</strong> ₹${claim.lossAmount.toFixed(2)}</p>
                <p>Please find the finalized claim report attached via the link below:</p>
                <a href="${claim.fileUrl}" style="display: inline-block; background: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Download Claim Excel</a>
                <p style="margin-top: 20px;">The reimbursement has been marked as approved in our system.</p>
              </div>
            `
        });
    }

    return NextResponse.json({ success: true, data: claim });

  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
