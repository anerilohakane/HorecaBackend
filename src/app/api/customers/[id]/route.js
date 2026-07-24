import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db/connect";
import Customer from "@/lib/db/models/customer";
import CustomerProductMapping from "@/lib/db/models/customerProductMapping";

/**
 * PATCH /api/customers/[id]
 * Update customer details: isVerified, category.
 */
export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();

    const { mappedProducts, ...customerUpdates } = body;

    const allowedUpdates = ["isVerified", "category"];
    const updates = {};

    Object.keys(customerUpdates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = customerUpdates[key];
      }
    });

    if (Object.keys(updates).length === 0 && mappedProducts === undefined) {
      return NextResponse.json(
        { success: false, error: "No valid update fields provided" },
        { status: 400 }
      );
    }

    if (mappedProducts !== undefined) {
      let currentCategory = updates.category;
      if (!currentCategory) {
        const existingCustomer = await Customer.findById(id).lean();
        if (!existingCustomer) {
          return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
        }
        currentCategory = existingCustomer.category || "C";
      }

      if (currentCategory === "C") {
        await CustomerProductMapping.findOneAndUpdate(
          { customer: id },
          { products: mappedProducts },
          { upsert: true, new: true }
        );
      } else {
        await CustomerProductMapping.findOneAndDelete({ customer: id });
      }
    }

    let customer;
    if (Object.keys(updates).length > 0) {
      customer = await Customer.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      }).lean();

      if (!customer) {
        return NextResponse.json(
          { success: false, error: "Customer not found" },
          { status: 404 }
        );
      }
    } else {
      customer = await Customer.findById(id).lean();
    }

    const mapping = await CustomerProductMapping.findOne({ customer: id }).lean();
    customer.mappedProducts = mapping ? (mapping.products || []) : [];

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (err) {
    console.error(`🔥 ERROR in PATCH /api/customers/${params.id}:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/customers/[id]
 */
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    console.log(`🔎 [BACKEND] GET /api/customers/${id} - Searching for customer...`);

    const customer = await Customer.findById(id).lean();
    console.log(`📦 [BACKEND] Customer found:`, customer ? "YES" : "NO");

    if (!customer) {
      const dbName = mongoose.connection.db?.databaseName || "UNKNOWN";
      const registeredModels = mongoose.modelNames();
      console.error(`[CUSTOMER ERROR] Customer not found for ID: ${id} | DB: ${dbName} | Models: ${registeredModels.join(', ')}`);

      return NextResponse.json(
        {
          success: false,
          error: "Customer not found",
          debugId: id,
          debugDb: dbName
        },
        { status: 404 }
      );
    }

    const mapping = await CustomerProductMapping.findOne({ customer: id }).lean();
    customer.mappedProducts = mapping ? (mapping.products || []) : [];

    // 🔄 Auto-reconcile & correct CN amounts to exact product prices, then sync customer cnBalance
    try {
      const CustomerCreditNote = (await import("@/lib/db/models/art/CustomerCreditNote")).default || (await import("@/lib/db/models/art/CustomerCreditNote"));
      const ReturnRequest = (await import("@/lib/db/models/returnRequest")).default || (await import("@/lib/db/models/returnRequest"));
      const Order = (await import("@/lib/db/models/order")).default || (await import("@/lib/db/models/order"));
      
      const custCNs = await CustomerCreditNote.find({ customer: id });
      let realTotalCnSum = 0;

      for (const cn of custCNs) {
        let currentCnAmount = cn.amount || 0;

        if (cn.items && cn.items.length > 0) {
          const itemSum = cn.items.reduce((s, i) => s + (Number(i.amount) || (Number(i.quantity || 0) * Number(i.rate || 0))), 0);
          if (itemSum > 0 && Math.abs(currentCnAmount - itemSum) > 0.01) {
            currentCnAmount = itemSum;
            await CustomerCreditNote.findByIdAndUpdate(cn._id, { $set: { amount: itemSum } });
          }
        } else if (cn.returnRequest) {
          const retReq = await ReturnRequest.findById(cn.returnRequest).populate("order");
          if (retReq && retReq.order && retReq.items) {
            const ord = retReq.order;
            let exactSum = 0;
            const freshItems = [];
            for (const rItem of retReq.items) {
              const finalQty = rItem.approvedQuantity || rItem.requestedReturnQty || rItem.quantity || 0;
              const oItem = ord.items?.find(i => String(i.product?._id || i.product) === String(rItem.product?._id || rItem.product));
              if (oItem && finalQty > 0) {
                const uPrice = Number(oItem.unitPrice || oItem.price || oItem.basePrice || 0);
                const itemTotal = finalQty * uPrice;
                exactSum += itemTotal;
                freshItems.push({
                  description: oItem.name,
                  hsnSac: oItem.sku || "",
                  quantity: finalQty,
                  rate: uPrice,
                  amount: itemTotal
                });
              }
            }
            if (exactSum > 0) {
              currentCnAmount = exactSum;
              await CustomerCreditNote.findByIdAndUpdate(cn._id, { $set: { amount: exactSum, items: freshItems } });
            }
          }
        }
        realTotalCnSum += currentCnAmount;
      }

      customer.cnBalance = realTotalCnSum;
      await Customer.findByIdAndUpdate(id, { $set: { cnBalance: realTotalCnSum } });
    } catch (reconcileErr) {
      console.error("Failed to auto-reconcile cnBalance in customer profile GET:", reconcileErr);
    }

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (err) {
    console.error(`🔥 ERROR in GET /api/customers/id:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}
