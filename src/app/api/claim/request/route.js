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
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
          .header { background: #f8fafc; padding: 32px 24px; border-bottom: 1px solid #e2e8f0; text-align: center; }
          .header h1 { margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
          .content { padding: 32px 24px; background: #ffffff; }
          .summary-card { background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .info-item { margin-bottom: 12px; }
          .label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px; }
          .value { font-size: 15px; font-weight: 600; color: #1e293b; }
          .price-impact { font-size: 20px; font-weight: 800; color: #e11d48; }
          .actions { margin-top: 32px; display: flex; gap: 12px; }
          .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; transition: all 0.2s; }
          .btn-approve { background: #10b981; color: #ffffff !important; }
          .btn-reject { background: #f1f5f9; color: #475569 !important; border: 1px solid #e2e8f0; }
          .footer { background: #f8fafc; padding: 20px 24px; font-size: 12px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Price Reduction Claim</h1>
            <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">Reference ID: ${claimId}</p>
          </div>
          <div class="content">
            <p>Hello <strong>${salesPersonName || 'Team'}</strong>,</p>
            <p>A price reduction request has been initiated by the SCM ODT team for the following product. Your approval is required to proceed with the claim settlement.</p>
            
            <div class="summary-card">
              <div class="info-item">
                <div class="label">Product Name</div>
                <div class="value">${product.name}</div>
              </div>
              <div style="display: table; width: 100%; margin-top: 16px;">
                <div style="display: table-cell; width: 50%;">
                  <div class="label">SKU / Code</div>
                  <div class="value">${product.sku}</div>
                </div>
                <div style="display: table-cell; width: 50%;">
                  <div class="label">Loss Recovery Amount</div>
                  <div class="value" style="color: #e11d48;">₹${lossAmount.toFixed(2)}</div>
                </div>
              </div>
              
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
              
              <div style="display: table; width: 100%;">
                <div style="display: table-cell; width: 50%;">
                  <div class="label">Current Expected Price</div>
                  <div class="value">₹${expectedSellingPrice.toFixed(2)}</div>
                </div>
                <div style="display: table-cell; width: 50%;">
                  <div class="label">Requested Selling Price</div>
                  <div class="price-impact">₹${requestedPrice}</div>
                </div>
              </div>
            </div>

            <p style="font-size: 14px; color: #64748b;">Please review the requested adjustment and provide your decision using the buttons below.</p>
            
            <div style="margin-top: 32px; text-align: center;">
              <a href="${approvalLink}" class="btn btn-approve">Approve Adjustment</a>
              &nbsp;
              <a href="${rejectLink}" class="btn btn-reject">Decline Request</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated system notification from Unifoods SCM Platform.</p>
            <p>&copy; 2026 Unifoods Procurement Team. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
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
