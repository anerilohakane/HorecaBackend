import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Product from "@/lib/db/models/product";
import Supplier from "@/lib/db/models/supplier";
import Claim from "@/lib/db/models/Claim";
import { sendEmail } from "@/lib/mail";
import crypto from "crypto";

export async function POST(req) {
  try {
    await connectDB();
    const { productId, requestedPrice, orderId, salesPersonEmail, salesPersonName } = await req.json();

    if (!productId || requestedPrice === undefined || !salesPersonEmail) {
      return NextResponse.json({ success: false, error: "Missing required fields (product, price, or salesperson)" }, { status: 400 });
    }

    // Fetch product with supplier details
    const product = await Product.findById(productId).populate("supplierId");
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const supplier = product.supplierId;
    if (!supplier) {
      return NextResponse.json({ success: false, error: "Supplier not found for this product" }, { status: 404 });
    }

    // Logic: expectedSellingPrice = basePrice + (basePrice * assuredMargin / 100)
    const basePrice = product.basePrice || 0;
    const margin = product.assuredMargin || 0;
    const expectedSellingPrice = basePrice + (basePrice * margin / 100);
    const lossAmount = expectedSellingPrice - requestedPrice;

    // Generate unique claim ID and approval token
    const claimId = `CLM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const approvalToken = crypto.randomBytes(32).toString("hex");

    // Create claim record
    const claim = new Claim({
      claimId,
      vendorId: supplier._id,
      productId: product._id,
      claimTemplateId: product.claimTemplateId,
      claimType: "PLUS_MINUS",
      requestedPrice,
      actualSellingPrice: requestedPrice,
      expectedSellingPrice,
      lossAmount,
      status: "REQUESTED",
      approvalToken,
      orderId,
      approvedBy: salesPersonName // Store selected person's name as initial reference
    });

    await claim.save();

    // Send approval email to selected person
    const approvalLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/claim/approve?token=${approvalToken}`;
    const rejectLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/claim/reject?token=${approvalToken}`;

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f59e0b;">Claim Approval Request</h2>
        <p>A price reduction has been requested for your product.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Product:</strong> ${product.name}</p>
          <p><strong>SKU:</strong> ${product.sku}</p>
          <p><strong>Base Price:</strong> ₹${basePrice}</p>
          <p><strong>Expected Selling Price:</strong> ₹${expectedSellingPrice.toFixed(2)}</p>
          <p><strong>Requested Selling Price:</strong> <span style="color: #e11d48; font-weight: bold;">₹${requestedPrice}</span></p>
          <p><strong>Loss Impact:</strong> ₹${lossAmount.toFixed(2)}</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <a href="${approvalLink}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Approve</a>
          <a href="${rejectLink}" style="background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-left: 10px;">Reject</a>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Reference ID: ${claimId}</p>
      </div>
    `;

    console.log(`[CLAIM] Preparing to send email. SMTP_USER defined: ${!!process.env.SMTP_USER}`);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
       console.warn("[CLAIM] SMTP credentials missing in environment variables.");
       return NextResponse.json({ 
          success: true, 
          message: "Claim created, but email could not be sent (SMTP credentials missing on server).",
          claimId 
       });
    }

    console.log(`[CLAIM] Dispatching email to: ${salesPersonEmail}`);
    
    try {
      const mailResult = await sendEmail({
        to: salesPersonEmail,
        subject: `Claim Approval Required: ${product.name}`,
        html: emailHtml
      });

      console.log(`[CLAIM] Mail Result:`, mailResult);

      if (!mailResult.success) {
         return NextResponse.json({ 
            success: true, 
            message: "Claim created, but email delivery failed: " + mailResult.error,
            claimId 
         });
      }
    } catch (mailErr) {
      console.error("[CLAIM] Critical mailer error:", mailErr);
      return NextResponse.json({ 
        success: true, 
        message: "Claim created, but mailer crashed: " + mailErr.message,
        claimId 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Claim request sent to ${salesPersonEmail} for approval`, 
      claimId 
    });
  } catch (error) {
    console.error("Claim request error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
