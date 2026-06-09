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
    const { orderId, claims, frontendUrl } = await req.json();

    if (!orderId || !claims || !Array.isArray(claims) || claims.length === 0) {
      return NextResponse.json({ success: false, error: "Missing required fields (orderId, claims)" }, { status: 400 });
    }

    let order = null;
    if (orderId) {
      const Order = (await import("@/lib/db/models/order")).default;
      order = await Order.findById(orderId);
      if (order) {
        const isDuplicateBlocked = (order.isDuplicateOrder || order.duplicateOf) && !["ignored", "separate_valid"].includes(order.duplicateStatus);
        if (isDuplicateBlocked) {
          return NextResponse.json({
            success: false,
            error: "Action blocked: The associated order is marked as a duplicate and is pending review or merged."
          }, { status: 400 });
        }
      }
    }

    // Fetch all products involved
    const productIds = claims.map(c => c.productId);
    const products = await Product.find({ _id: { $in: productIds } }).populate("supplierId");

    // Check for existing claims to prevent duplicates
    const existingClaims = await Claim.find({
      orderId,
      productId: { $in: productIds },
      status: { $in: ["REQUESTED", "APPROVED"] }
    });
    if (existingClaims.length > 0) {
      return NextResponse.json({ success: false, error: "One or more products already have an active claim for this order." }, { status: 400 });
    }

    // Group claims by supplierId and salesPersonEmail
    const supplierGroups = {};
    for (const claimRequest of claims) {
      const product = products.find(p => p._id.toString() === claimRequest.productId);
      if (!product || !product.supplierId) continue;

      const supplierIdStr = product.supplierId._id.toString();
      const spEmail = claimRequest.salesPersonEmail || product.supplierId.email;
      const groupKey = `${supplierIdStr}_${spEmail}`;
      
      if (!supplierGroups[groupKey]) {
        supplierGroups[groupKey] = {
          supplier: product.supplierId,
          salesPersonEmail: spEmail,
          salesPersonName: claimRequest.salesPersonName || product.supplierId.ownerName || product.supplierId.businessName,
          products: [],
          claimRequests: []
        };
      }
      supplierGroups[groupKey].products.push(product);
      supplierGroups[groupKey].claimRequests.push(claimRequest);
    }

    const results = [];

    // Process each vendor group
    for (const groupKey of Object.keys(supplierGroups)) {
      const group = supplierGroups[groupKey];
      const supplier = group.supplier;
      const salesPersonEmail = group.salesPersonEmail;
      const salesPersonName = group.salesPersonName;

      const approvalToken = crypto.randomBytes(32).toString("hex");

      let totalLossAmount = 0;
      const createdClaims = [];

      // Create claims for this vendor
      for (let i = 0; i < group.products.length; i++) {
        const product = group.products[i];
        const request = group.claimRequests[i];

        const basePrice = product.basePrice || 0;
        const margin = product.assuredMargin || 0;
        const expectedSellingPrice = basePrice + (basePrice * margin / 100);
        const lossAmount = expectedSellingPrice - request.requestedPrice;

        // Find quantity from the order items
        const orderItem = order ? order.items.find(item => item.product.toString() === product._id.toString()) : null;
        const quantity = orderItem ? orderItem.quantity : 1;
        const claimAmount = lossAmount * quantity;

        totalLossAmount += claimAmount;

        const claimId = `CLM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const claim = new Claim({
          claimId,
          vendorId: supplier._id,
          productId: product._id,
          claimTemplateId: product.claimTemplateId,
          claimType: "PLUS_MINUS",
          requestedPrice: request.requestedPrice,
          actualPrice: request.actualPrice || 0,
          actualSellingPrice: request.requestedPrice,
          expectedSellingPrice,
          lossAmount,
          quantity,
          claimAmount,
          vendorResponseStatus: "PENDING",
          actionLog: [
            {
              action: "REQUEST_CREATED",
              note: `Bulk claim request created for ${quantity} unit(s)`,
              performedBy: "SCM System",
              timestamp: new Date()
            }
          ],
          status: "REQUESTED",
          approvalToken, // Shared token for this vendor's bulk
          orderId,
          approvedBy: salesPersonName,
          salesRepresentativeName: salesPersonName
        });

        await claim.save();
        createdClaims.push(claim);
      }

      // Generate HTML for product list in email
      let productRowsHtml = '';
      for (let i = 0; i < group.products.length; i++) {
        const product = group.products[i];
        const reqPrice = group.claimRequests[i].requestedPrice;
        const basePrice = product.basePrice || 0;
        const margin = product.assuredMargin || 0;
        const expected = basePrice + (basePrice * margin / 100);
        const loss = expected - reqPrice;

        const orderItem = order ? order.items.find(item => item.product.toString() === product._id.toString()) : null;
        const quantity = orderItem ? orderItem.quantity : 1;
        const claimAmount = loss * quantity;

        productRowsHtml += `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${product.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${product.sku || 'N/A'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">₹${expected.toFixed(2)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #e11d48; font-weight: bold;">₹${reqPrice}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #e11d48;">₹${loss.toFixed(2)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #e11d48; font-weight: bold;">₹${claimAmount.toFixed(2)}</td>
          </tr>
        `;
      }

      // Generate Approval Link
      const baseUrl = frontendUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const approvalLink = `${baseUrl}/vendor-claim-approval/${approvalToken}`;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; }
            .container { max-width: 700px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .header { background: #f8fafc; padding: 32px 24px; border-bottom: 1px solid #e2e8f0; text-align: center; }
            .header h1 { margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
            .content { padding: 32px 24px; background: #ffffff; }
            .summary-card { background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0; }
            table { width: 100%; border-collapse: collapse; text-align: left; }
            th { padding: 10px; border-bottom: 2px solid #cbd5e1; font-size: 12px; color: #64748b; text-transform: uppercase; }
            .btn { display: inline-block; padding: 14px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 15px; transition: all 0.2s; background: #10b981; color: #ffffff !important; }
            .footer { background: #f8fafc; padding: 20px 24px; font-size: 12px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bulk Claim Approval Request</h1>
              <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">Order ID: ${orderId}</p>
            </div>
            <div class="content">
              <p>Hello <strong>${salesPersonName || 'Team'}</strong>,</p>
              <p>The SCM team has initiated a bulk price reduction claim for multiple products. Please review the claims below and approve or reject them.</p>
              
              <div class="summary-card">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Expected Price</th>
                      <th>Requested Price</th>
                      <th>Qty</th>
                      <th>Loss (Unit)</th>
                      <th>Total Claim</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productRowsHtml}
                  </tbody>
                </table>
              </div>

              <div style="text-align: center; margin-top: 32px;">
                <p style="font-size: 14px; color: #64748b; margin-bottom: 16px;">Click the button below to access the secure approval portal.</p>
                <a href="${approvalLink}" class="btn">Review & Approve Claims</a>
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

      console.log(`[BULK_CLAIM] Preparing to send email to ${salesPersonEmail}.`);

      let emailStatus = "Sent";
      try {
        const mailResult = await sendEmail({
          to: salesPersonEmail,
          subject: `Bulk Claim Approval Required for Order ${orderId}`,
          html: emailHtml
        });
        console.log(`[BULK_CLAIM] Mail Result for ${salesPersonEmail}:`, mailResult);
        if (!mailResult || !mailResult.success) {
          emailStatus = `Failed: ${mailResult?.error || 'Unknown error'}`;
        }
      } catch (mailErr) {
        console.error(`[BULK_CLAIM] Critical mailer error for ${salesPersonEmail}:`, mailErr);
        emailStatus = `Crashed: ${mailErr.message}`;
      }

      results.push({
        vendorId: supplier._id,
        vendorName: supplier.businessName,
        claimsCreated: createdClaims.length,
        salesPersonEmailed: salesPersonEmail,
        emailStatus: emailStatus
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Bulk claims processed successfully", 
      results
    });
  } catch (error) {
    console.error("Bulk claim request error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
