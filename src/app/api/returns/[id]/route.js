import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import ReturnRequest from "@/lib/db/models/returnRequest";
import ReturnActivityLog from "@/lib/db/models/returnActivityLog";
import Order from "@/lib/db/models/order";
import User from "@/lib/db/models/User";
import Customer from "@/lib/db/models/customer";
import Supplier from "@/lib/db/models/supplier";
import Product from "@/lib/db/models/product";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const returnReq = await ReturnRequest.findById(id)
      .populate("order")
      .populate("items.product", "name sku")
      .populate("requester", "name email phone")
      .populate("supplier", "brand businessName");

    if (!returnReq) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
    }

    const activityLogs = await ReturnActivityLog.find({ returnRequest: id }).sort({ createdAt: -1 });

    return NextResponse.json({ data: returnReq, logs: activityLogs }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const returnReq = await ReturnRequest.findById(id);
    if (!returnReq) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
    }

    const oldStatus = returnReq.status;
    
    // Strict Backend Validation
    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items) {
        const maxAllowed = item.requestedReturnQty || item.quantity || 0;
        if (item.approvedQuantity > maxAllowed) {
          return NextResponse.json(
            { error: `Approved quantity (${item.approvedQuantity}) cannot exceed requested quantity (${maxAllowed})` },
            { status: 400, headers: corsHeaders }
          );
        }
      }
    }

    // Update fields
    Object.keys(body).forEach((key) => {
      // Don't arbitrarily overwrite specific protected objects unless handled
      if (key !== "action" && key !== "performedBy" && key !== "userType" && key !== "remarks") {
        returnReq[key] = body[key];
      }
    });

    if (body.status === "Vendor Approved" || body.status === "Partially Approved") {
      // Set Pickup SLA to 3 days from approval
      returnReq.pickupSlaDueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      returnReq.vendorActedAt = new Date();
    }

    // AUTO-GENERATE CREDIT NOTE IF GODOWN VERIFIES GOOD CONDITION
    if (body.godownCondition === "Good" && body.cnGenerationAllowed === true) {
      returnReq.godownReceivedAt = new Date();
      if (!returnReq.provisionalCreditNote) { // Avoid duplicate CNs
        try {
        const CustomerCreditNote = require("@/lib/db/models/art/CustomerCreditNote").default || require("@/lib/db/models/art/CustomerCreditNote");
        const Employee = require("@/lib/db/models/payroll/Employee").default || require("@/lib/db/models/payroll/Employee");
        
        const existingCN = await CustomerCreditNote.findOne({ returnRequest: id });
        
        if (!existingCN) {
          const originalOrder = await Order.findById(returnReq.order).lean();
          let totalRefund = 0;
          let cnItems = [];

          if (originalOrder && originalOrder.items) {
            for (const rItem of returnReq.items) {
              const approvedQty = body.items ? body.items.find(i => String(i.product) === String(rItem.product))?.approvedQuantity : rItem.approvedQuantity;
              const finalQty = approvedQty || rItem.approvedQuantity || 0;
              
              if (finalQty > 0) {
                const oItem = originalOrder.items.find(i => {
                  const iProductId = i.product?._id || i.product?.id || i.productId || i.product;
                  const rProductId = rItem.product?._id || rItem.product?.id || rItem.product;
                  return String(iProductId) === String(rProductId);
                });
                
                // Send Product to Open Storage
                try {
                  const mongoose = require("mongoose");
                  const db = mongoose.connection.db;
                  if (db) {
                    await db.collection("openstorages").insertOne({
                      productId: String(oItem.product?._id || oItem.product?.id || oItem.productId || oItem.product),
                      productName: oItem.name || "Unknown Product",
                      sku: oItem.sku || "",
                      quantity: finalQty,
                      unit: oItem.unit || "pcs",
                      unitPrice: oItem.unitPrice || 0,
                      totalPrice: finalQty * (oItem.unitPrice || 0),
                      grnNumber: returnReq.rrn,
                      status: "Available",
                      receivedDate: new Date(),
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      __v: 0
                    });
                  }
                } catch(storageErr) {
                  console.error("Failed to send product to open storage:", storageErr);
                }

                if (oItem) {
                  const itemUnitPrice = Number(oItem.unitPrice || oItem.price || oItem.basePrice || 0);
                  const amount = finalQty * itemUnitPrice;
                  totalRefund += amount;
                  
                  cnItems.push({
                    description: oItem.name,
                    hsnSac: oItem.sku || "",
                    quantity: finalQty,
                    rate: itemUnitPrice,
                    amount: amount,
                    cgstPercent: 0,
                    sgstPercent: 0
                  });
                }
              }
            }
          }

          if (totalRefund > 0) {
            // Find ART Member
            let assignedArtMember = null;
            let artUsers = await User.find({ department: /ART/i });
            if (artUsers.length === 0) {
              const artEmployees = await Employee.find({ "jobDetails.department": /ART/i });
              if (artEmployees.length > 0) {
                const employeeIds = artEmployees.map(e => e.employeeId);
                artUsers = await User.find({ employeeId: { $in: employeeIds } });
              }
            }
            if (artUsers.length > 0) {
              assignedArtMember = artUsers[Math.floor(Math.random() * artUsers.length)]._id;
            }

            // Generate a CN Number
            const latestCN = await CustomerCreditNote.findOne().sort({ createdAt: -1 });
            let cnNumber = "CCN-0001";
            if (latestCN && latestCN.cnNumber && latestCN.cnNumber.startsWith("CCN-")) {
              const parts = latestCN.cnNumber.split("-");
              const num = parseInt(parts[1], 10);
              if (!isNaN(num)) {
                cnNumber = `CCN-${String(num + 1).padStart(4, "0")}`;
              }
            }

            await CustomerCreditNote.create({
              cnNumber,
              customer: returnReq.requester,
              order: returnReq.order,
              returnRequest: returnReq._id,
              amount: totalRefund,
              reason: `Refund for Return Request ${returnReq.rrn}`,
              items: cnItems,
              assignedArtMember,
              communicationStatus: "Pending"
            });

            // 💳 Auto-increment customer's CN balance
            if (returnReq.requester) {
              await Customer.findByIdAndUpdate(returnReq.requester, {
                $inc: { cnBalance: totalRefund }
              });
            }
            
            returnReq.provisionalCreditNote = cnNumber;
            returnReq.status = "Credit Note Generated";
          }
        }
      } catch (cnError) {
        console.error("Auto CN Generation Failed:", cnError);
      }
    }
    }
    
    if (body.status === "Pending SCM Assignment") {
      returnReq.pickupConfirmedAt = new Date();
    }

    await returnReq.save();

    if (body.action || body.status !== oldStatus) {
      await ReturnActivityLog.create({
        returnRequest: id,
        action: body.action || "Status Updated",
        oldStatus,
        newStatus: returnReq.status,
        remarks: body.remarks || `Status changed from ${oldStatus} to ${returnReq.status}`,
        performedBy: body.performedBy || null,
        userType: body.userType || "System"
      });
    }

    return NextResponse.json({ message: "Updated successfully", data: returnReq }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
  }
}
