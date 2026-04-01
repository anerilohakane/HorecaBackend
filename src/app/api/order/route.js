// src/app/api/order/route.js
/**
 *
 * Notes:
 *  - For POST, preferred body is items array.
 *  - Shortcut supported:
 *      { userId, productId, quantity, price, ... }
 */

import mongoose from "mongoose";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/order";
import Product from "@/lib/db/models/product";
import Supplier from "@/lib/db/models/supplier";
import User from "@/lib/db/models/User";
import Customer from "@/lib/db/models/customer";
import { logger } from "@/lib/logger";

// (json helper assumed already in file)
const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Safe populate helper:
 * - path: populate path string (e.g. "supplier", "user", "items.product")
 * - select: projection string
 * Uses Order.schema to determine the ref model name(s) and only populates if registered.
 */
function safePopulateQuery(query, path, select = "") {
  // get list of registered model names
  const registered = mongoose.modelNames();

  // helper to resolve ref model for a path (support nested like items.product)
  function resolveRefForPath(p) {
    // direct path e.g. 'supplier' or 'user' on Order schema
    const sp = Order.schema.path(p);
    if (!sp) return null;
    if (sp.options && sp.options.ref) return sp.options.ref;
    if (sp.options && sp.options.refPath) return "POLYMORPHIC"; // indicator

    // handle nested path like 'items.product'
    if (p.includes(".")) {
      const [arrPath, subPath] = p.split(".", 2); // items, product
      const arrSchemaPath = Order.schema.path(arrPath);
      if (arrSchemaPath && arrSchemaPath.caster) {
        // When items is an array of subdocs, subdoc schema might be at caster.schema
        const casterSchema =
          arrSchemaPath.caster.schema || arrSchemaPath.caster;
        if (
          casterSchema &&
          casterSchema.path(subPath) &&
          casterSchema.path(subPath).options
        ) {
           const osp = casterSchema.path(subPath).options;
           if (osp.ref) return osp.ref;
           if (osp.refPath) return "POLYMORPHIC";
        }
      }
    }

    return null;
  }

  const refModel = resolveRefForPath(path);

  if (!refModel) {
    // no ref defined in schema for this path -> don't populate
    console.warn(
      `[safePopulate] No ref or refPath found in Order.schema for path "${path}" — skipping populate.`
    );
    return query;
  }

  // If polymorphic, we just trust Mongoose to handle it if the models are registered.
  // Standard non-polymorphic check
  if (refModel !== "POLYMORPHIC" && !registered.includes(refModel)) {
    console.warn(
      `[safePopulate] Model "${refModel}" for path "${path}" is NOT registered. Skipping populate. Registered models: ${registered.join(
        ", "
      )}`
    );
    return query;
  }

  // safe to populate
  return query.populate(path, select);
}
/* ------------------------------------------------------------------
   POST  -> PLACE ORDER
   Body formats supported:
   1) Preferred (items array):
   {
      userId | user,
      items: [{ product, quantity, unitPrice?, attributes? }],
      supplierId?,
      shippingCharges?, tax?, discounts?, currency?, b2b?, notes?,
      payment: { method, status?, transactionId? },
      decrementStock?: true
   }
   2) Shortcut single-item:
   {
      userId | user,
      productId,
      quantity,
      price,             // treated as unitPrice
      supplierId?, ...
   }
------------------------------------------------------------------ */
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const shippingAddress = body.shippingAddress || null; // ⭐ REQUIRED

    // 1) Identify Who is Placing the Order (User, Customer, or Supplier)
    const placerId = body.userId || body.user || body.supplierId;
    if (!placerId) {
      return json({ success: false, error: "Identification (userId or supplierId) is required" }, 400);
    }

    let user = await User.findById(placerId);
    let userModel = "User";

    if (!user) {
      user = await Customer.findById(placerId);
      userModel = "Customer";
    }

    if (!user) {
      user = await Supplier.findById(placerId);
      userModel = "Supplier";
    }

    if (!user) {
      return json({ success: false, error: "Customer/User/Supplier not found with the provided ID" }, 404);
    }

    // 2) items array or single-item shortcut
    let itemsInput = body.items;
    if (
      (!Array.isArray(itemsInput) || itemsInput.length === 0) &&
      body.productId
    ) {
      itemsInput = [
        {
          product: body.productId,
          quantity: body.quantity ?? 1,
          unitPrice: body.price,
          attributes: body.attributes || null,
        },
      ];
    }

    if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
      return json(
        {
          success: false,
          error:
            "items array is required (or provide productId/quantity/price)",
        },
        400
      );
    }

    // 3) Build items + totals
    const builtItems = [];
    let subtotal = 0;
    let detectedSupplier = body.supplierId || body.supplier || null;
    const stockErrors = [];

    for (const it of itemsInput) {
      const productId = it.product || it.productId;
      if (!productId) {
        return json(
          {
            success: false,
            error: "Each item must include product (or productId)",
          },
          400
        );
      }

      const product = await Product.findById(productId);
      if (!product) {
        return json(
          { success: false, error: `Product not found: ${productId}` },
          404
        );
      }

      const qty = Number(it.quantity ?? 1);
      if (Number.isNaN(qty) || qty < 1) {
        return json(
          { success: false, error: "Quantity must be a positive number" },
          400
        );
      }

      const unitPrice =
        typeof it.unitPrice === "number"
          ? it.unitPrice
          : typeof it.price === "number"
          ? it.price
          : product.price ?? 0;

      const totalPrice = unitPrice * qty;
      subtotal += totalPrice;

      // 🔹 FIX THIS LATER TO USE product.supplierId IF YOU HAVE IT
      if (!detectedSupplier && (product.supplierId || product.supplier)) {
        detectedSupplier = product.supplierId || product.supplier;
      }

      if (typeof product.stockQuantity === "number" && product.stockQuantity < qty) {
        stockErrors.push({
          product: product._id,
          available: product.stockQuantity,
          requested: qty,
        });
      }

      builtItems.push({
        product: product._id,
        name: product.name || product.title || "Unnamed Product",
        sku: product.sku || String(product._id),
        quantity: qty,
        unitPrice,
        totalPrice,
        gst: product.gst || 0, // Persist GST from product model
        supplier: product.supplierId || product.supplier || null,
        image: it.image || product.image || null, // ✅ Added image persistence
        attributes: it.attributes || null,
      });
    }

    if (stockErrors.length > 0) {
      return json(
        { success: false, error: "Insufficient stock", details: stockErrors },
        409
      );
    }

    // 4) Totals mapped to your schema
    const gstAmount = Number(body.gstAmount ?? body.taxAmount ?? body.tax ?? 0);
    const shippingCharges = Number(body.shippingCharges ?? 0);
    const platformFee = Number(body.platformFee ?? 0);
    const discounts = Number(body.discounts ?? 0);
    const total = subtotal + gstAmount + shippingCharges + platformFee - discounts;

    // Calculate aggregated GST percentage
    const orderGst = subtotal > 0 ? (gstAmount / subtotal) * 100 : 0;

    // 5) Supplier ref
    let supplierRef = null;
    if (detectedSupplier || body.supplierId || body.supplier) {
      const supplierToCheck =
        detectedSupplier || body.supplierId || body.supplier;
      const sup = await Supplier.findById(supplierToCheck);
      if (sup) supplierRef = sup._id;
    }

    // 6) Notes + metadata (schema expects String for notes)
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    // 7) 🔥 PAYMENT VALIDATION & NORMALIZATION

    // Normalize method
    const rawMethod = (body.paymentMethod || body.payment?.method || "")
      .toString()
      .trim()
      .toLowerCase();

    if (!rawMethod) {
      return json(
        {
          success: false,
          error: "paymentMethod is required (e.g. 'cod', 'upi', 'card')",
        },
        400
      );
    }

    let paymentMethod = rawMethod;
    let transactionId =
      body.transactionId || body.payment?.transactionId || undefined;
    let paymentStatus = body.paymentStatus || body.payment?.status;
    let paidAt;

    const isCOD =
      paymentMethod === "cod" ||
      paymentMethod === "cash_on_delivery" ||
      paymentMethod === "cash";

    if (isCOD) {
      // 🔹 COD rules:
      //  - method normalized to "cod"
      //  - status = "pending" at order creation
      paymentMethod = "cod";
      if (!paymentStatus) paymentStatus = "pending";
      // no transactionId required, no paidAt at creation
    } else if (paymentMethod === "wallet") {
      // 🔹 Wallet/Points payment
      // DO NOT DEDUCT HERE. The 'Final Debit' at the end of the function handles it securely.
      paymentStatus = "paid";
      paidAt = new Date();
      // transactionId will be set after debit is confirmed at the finish line
    } else {
      // 🔹 Online payment (UPI, card, netbanking, etc.)
      //  - transactionId is required
      if (!transactionId) {
        return json(
          {
            success: false,
            error: "transactionId is required for non-COD payments",
          },
          400
        );
      }

      // If status not provided, assume paid
      if (!paymentStatus) paymentStatus = "paid";

      // If status is paid at creation, set paidAt now
      if (paymentStatus === "paid") {
        paidAt = new Date();
      } else if (paymentStatus === "failed") {
        await logger({
          level: 'warn',
          message: 'Payment failed during order creation',
          action: 'PAYMENT_FAILED',
          userId: user._id,
          metadata: { transactionId, bodyPaymentStatus: paymentStatus },
          req: request
        });
      }
    }

    // 8) Build orderDoc according to your OrderSchema
    const orderDoc = new Order({
      user: user._id,
      userModel: userModel,
      supplier: supplierRef,
      items: builtItems,
      
      shippingAddress: shippingAddress,

      subtotal,
      gst: Math.round(orderGst), // Store percentage (branded as GST in db)
      gstAmount,
      shippingCharges,
      platformFee,
      discounts,
      total,
      currency: body.currency || "INR",

      status: body.status || "pending",
      placedAt: new Date(),

      payment: {
        method: paymentMethod,
        status: paymentStatus,
        transactionId,
        paidAt,
      },

      delivery: body.delivery || {},
      b2b: body.b2b || {},

      notes,
      cancellationReason: "",
      department: body.department || "ODT",
      metadata: body.metadata || null,
    });


    // 9) AUTO-INVOICE (using your InvoiceSchema)
    const now = new Date();
    const invoiceNumber =
      body.invoiceNumber ||
      `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}${String(now.getDate()).padStart(2, "0")}-${orderDoc._id
        .toString()
        .slice(-6)}`;

    orderDoc.invoice = {
      invoiceNumber,
      generatedAt: now,
      url: body.invoiceUrl || "",
      meta: {
        user: orderDoc.user,
        supplier: orderDoc.supplier,
        subtotal,
        gst: Math.round(orderGst),
        gstAmount,
        shippingCharges,
        platformFee,
        discounts,
        total,
        currency: orderDoc.currency,
        notes: body.invoiceNotes || "",
        paymentMethod,
        paymentStatus: orderDoc.payment.status, // Use live status
        paidAt: orderDoc.payment.paidAt || null,
      },
    };


    // 9.5) 🔥 MARKETPLACE AUTO-SETTLEMENT: Settle for ALL unique suppliers in items
    const isNowDelivered = (orderDoc.status || "").toLowerCase() === "delivered" || (orderDoc.delivery?.status || "").toLowerCase() === "delivered";
    const isPaidAtCreation = (orderDoc.payment?.status || "").toLowerCase() === "paid";
    
    console.log(`[ORDER LOG] Flow: Auto-Settlement Check | Del: ${isNowDelivered} | Paid: ${isPaidAtCreation}`);

    try {
      const Wallet = (await import("@/lib/db/models/wallet")).default;
      const Transaction = (await import("@/lib/db/models/transaction")).default;

      // 🟢 IDENTIFY UNIQUE SUPPLIERS
      const suppliers = new Set();
      if (orderDoc.supplier) suppliers.add(orderDoc.supplier.toString());
      (orderDoc.items || []).forEach(item => {
         if (item.supplier) suppliers.add(item.supplier.toString());
      });
      console.log(`[ORDER LOG] Marketplace Detected Suppliers: ${[...suppliers].join(', ')}`);

      for (const sId of suppliers) {
        const supplierId = new mongoose.Types.ObjectId(sId);
        
        let wallet = await Wallet.findOne({ userId: supplierId });
        if (!wallet) {
          wallet = new Wallet({ userId: supplierId, balance: 0, userType: 'supplier' });
        }

        // 1) Auto-Settle items if order is already Delivered + Paid
        const supplierTotal = (orderDoc.items || [])
          .filter(item => item.supplier?.toString() === sId)
          .reduce((sum, item) => sum + (item.totalPrice || 0), 0);

        if (isNowDelivered && isPaidAtCreation && supplierTotal > 0) {
          console.log(`[ORDER LOG] Triggering AUTO-SETTLEMENT for Vendor: ${sId} | Amount: ₹${supplierTotal}`);
          const settlementTx = new Transaction({
            userId: supplierId,
            walletId: wallet._id,
            amount: supplierTotal,
            type: "order_settlement", 
            method: "wallet",
            status: "completed",
            description: `Auto-Settlement for Order Items: ${orderDoc.orderNumber}`,
            metadata: { orderId: orderDoc._id, orderNumber: orderDoc.orderNumber }
          });
          await settlementTx.save();
        }

        // 2) Force Sync Snapshot for EVERY involved supplier (Marketplace Aware)
        const summary = await Order.aggregate([
          { $match: { 
               $or: [
                 { supplier: supplierId },
                 { "items.supplier": supplierId }
               ]
          } },
          { $unwind: "$items" },
          {
             $group: {
               _id: null,
               realized: { $sum: { $cond: [{ $and: [{ $eq: ["$items.supplier", supplierId] }, { $eq: ["$status", "delivered"] }, { $eq: ["$payment.status", "paid"] }] }, "$items.totalPrice", 0] } },
               escrowed: { $sum: { $cond: [{ $and: [{ $eq: ["$items.supplier", supplierId] }, { $in: ["$status", ["pending", "confirmed", "packed", "shipped", "out_for_delivery"]] }] }, "$items.totalPrice", 0] } }
             }
          }
        ]);

        const snap = summary[0] || { realized: 0, escrowed: 0 };
        
        const ledgerTruth = await Transaction.aggregate([
          { $match: { userId: supplierId, status: 'completed' } },
          {
            $group: {
              _id: null,
              balance: { $sum: { $cond: [{ $in: ["$type", ["deposit", "refund", "transfer", "order_settlement", "adjustment"]] }, "$amount", { $multiply: ["$amount", -1] }] } }
            }
          }
        ]);

        wallet.balance = ledgerTruth[0]?.balance || 0;
        wallet.realizedSavings = snap.realized;
        wallet.escrowedPoints = snap.escrowed;
        await wallet.save();
        console.log(`[ORDER LOG] COMPLETED Sync for Vendor ${sId} | Balance: ₹${wallet.balance} | Escrow: ₹${wallet.escrowedPoints}`);
      }
    } catch (e) {
      console.error("[ORDER LOG] Marketplace Settlement Error:", e);
    }

    // 10) Save
    await orderDoc.save();

    // 11) Optional stock decrement (Default to TRUE unless explicitly false)
    if (body.decrementStock !== false) {
      console.log("Starting stock decrement for order:", orderDoc._id);
      for (const it of builtItems) {
        if (typeof it.quantity === "number" && it.quantity > 0) {
          console.log(`Decrementing stock for product ${it.product} by ${it.quantity}`);
          const updateRes = await Product.updateOne(
            { _id: it.product },
            { $inc: { stockQuantity: -it.quantity } }
          );
          console.log(`Stock update result for ${it.product}:`, updateRes);
        }
      }
    } else {
      console.log("Stock decrement skipped (decrementStock === false)");
    }

    await logger({
      level: 'info',
      message: `Order created successfully: ${orderDoc._id}`,
      action: 'ORDER_CREATED',
      userId: user._id,
      metadata: { orderId: orderDoc._id, subtotal, total },
      req: request
    });

    // --- 🏆 FINAL STEP: AUTOMATIC WALLET DEBIT (Secure Point Deduction) --- 🏆
    // Only deduct points IF EVERYTHING above passed (Order saved, Stock checked)
    const isWalletPay = (body.paymentMethod || "").toLowerCase() === "wallet";
    if (isWalletPay) {
      try {
        const Wallet = (await import("@/lib/db/models/wallet")).default;
        const Transaction = (await import("@/lib/db/models/transaction")).default;

        // JIT Audit: Recalculate Truth Balance from ledger
        const ledger = await Transaction.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(user._id), status: 'completed' } },
          {
            $group: {
              _id: null,
              in: { $sum: { $cond: [{ $in: ["$type", ["deposit", "refund", "transfer", "order_settlement", "adjustment"]] }, { $abs: "$amount" }, 0] } },
              out: { $sum: { $cond: [{ $in: ["$type", ["withdrawal", "order_payment"]] }, { $abs: "$amount" }, 0] } }
            }
          }
        ]);
        const truth = ledger[0] || { in: 0, out: 0 };
        const realBalance = Math.max(0, truth.in - truth.out);

        if (realBalance < total) {
           throw new Error(`Insufficient wallet balance. Audited Truth: ₹${realBalance} | Total: ₹${total}`);
        }

        let buyerWallet = await Wallet.findOne({ userId: user._id });
        if (!buyerWallet) {
           buyerWallet = new Wallet({ userId: user._id, balance: realBalance, userType: 'supplier' });
        }

        // Create Debit Transaction
        const debitTx = new Transaction({
          userId: new mongoose.Types.ObjectId(user._id),
          walletId: new mongoose.Types.ObjectId(buyerWallet._id),
          amount: total,
          type: "order_payment",
          method: "wallet",
          status: "completed",
          description: `Internal Procurement: ${orderDoc.orderNumber}`,
          metadata: { orderId: orderDoc._id, orderNumber: orderDoc.orderNumber, type: "wallet_debit" }
        });
        await debitTx.save();

        // Update Balance
        buyerWallet.balance = (realBalance - total);
        await buyerWallet.save();
        console.log(`[FINANCE LOG] 🔒 Point Deduction Finalized for Buyer ${user._id} | New Balance: ₹${buyerWallet.balance}`);
      } catch (e) {
        console.error("[CRITICAL FINANCE ERROR]: Order placed but debit failed:", e);
        // We throw here to fail the order if the debit cannot be secured
        throw new Error(`Payment processing failed. ${e.message}`);
      }
    }

    return json({ 
      success: true, 
      order: orderDoc,
      message: "Marketplace order placed & points audited"
    }, 201);
  } catch (err) {
    console.error("POST /api/order error:", err);
    await logger({
      level: 'error',
      message: 'Error during order creation',
      action: 'ORDER_CREATE_ERROR',
      metadata: { error: err.message, stack: err.stack },
      req: request
    });
    if (err.name === "ValidationError") {
      return json(
        {
          success: false,
          error: "Order validation failed",
          details: err.errors,
        },
        400
      );
    }
    return json({ success: false, error: err.message || "Server error" }, 500);
  }
}

/* ------------------------------------------------------------------
   GET  -> LIST ORDERS
   Query params:
     - userId OR user
     - supplierId
     - status
     - page
     - limit
     - q (search text)
------------------------------------------------------------------ */
/* ------------------------------------------------------------------
   GET  -> FETCH SINGLE ORDER or FETCH ALL ORDERS BY USER ID
------------------------------------------------------------------ */
export async function GET(request) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const idParam =
      url.searchParams.get("id") || url.searchParams.get("orderId");

    /* -----------------------------
       FETCH SINGLE ORDER BY ID
    ------------------------------*/
    if (idParam) {
      if (!mongoose.Types.ObjectId.isValid(idParam)) {
        return json({ success: false, error: "Invalid orderId" }, 400);
      }

      let query = Order.findById(idParam);

      query = safePopulateQuery(query, "user", "name email phone");
      query = safePopulateQuery(query, "supplier", "name");
      query = safePopulateQuery(query, "items.product", "name price sku");

      const order = await query.lean();

      if (!order) {
        return json({ success: false, error: "Order not found" }, 404);
      }

      // ✅ FIXED: Return "order" instead of "data"
      return json({ success: true, order }, 200);
    }

    const userId =
      url.searchParams.get("userId") || url.searchParams.get("user");
    const status = url.searchParams.get("status");
    const supplierId = url.searchParams.get("supplierId");
    const department = url.searchParams.get("department");

    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(100, Number(url.searchParams.get("limit") || 20));
    const skip = (page - 1) * limit;

    const q = {};
    if (userId) q.user = userId;
    if (status) q.status = status;
    if (supplierId) q.supplier = supplierId;
    if (department) q.department = department;



    let query = Order.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit);

    query = safePopulateQuery(query, "user", "name email phone");
    query = safePopulateQuery(query, "supplier", "name");
    query = safePopulateQuery(query, "items.product", "name price sku");

    const [orders, total] = await Promise.all([
      query.lean(),
      Order.countDocuments(q),
    ]);

    return json(
      {
        success: true,
        orders,
        meta: { total, page, limit },
      },
      200
    );
  } catch (err) {
    console.error("GET /api/order error:", err);
    return json({ success: false, error: err.message || "Server error" }, 500);
  }
}

export async function PATCH(request) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const idParam =
      url.searchParams.get("id") || url.searchParams.get("orderId");

    if (!idParam || !mongoose.Types.ObjectId.isValid(idParam)) {
      return json({ success: false, error: "Invalid orderId" }, 400);
    }

    const body = await request.json();

    // fetch current order
    const order = await Order.findById(idParam);
    if (!order) return json({ success: false, error: "Order not found" }, 404);

    const curStatus = String(order.status || "").toLowerCase();
    const requestedStatus = body.status
      ? String(body.status).toLowerCase()
      : null;
    console.log(body);

    const setData = {};
    const update = { $currentDate: { updatedAt: true } };

    // Helper: compute refundable amount according to policy + request override
    function computeRefundAmount({
      orderDoc,
      cancellationFee = 0,
      cancellationFeePercent = 0,
      restockingFee = 0,
      restockingFeePercent = 0,
      nonRefundableShipping = false,
    } = {}) {
      // Prefer explicit payment.amount if present
      const paidAmount =
        (orderDoc.payment && typeof orderDoc.payment.amount === "number"
          ? orderDoc.payment.amount
          : null) ?? (typeof orderDoc.total === "number" ? orderDoc.total : 0);

      const shippingCharge =
        typeof orderDoc.shippingCharge === "number"
          ? orderDoc.shippingCharge
          : orderDoc.shippingCharges &&
            typeof orderDoc.shippingCharges === "number"
          ? orderDoc.shippingCharges
          : (orderDoc.invoice &&
              orderDoc.invoice.meta &&
              orderDoc.invoice.meta.shippingCharges) ||
            0;

      const cancelFeeFromPercent =
        (Number(cancellationFeePercent || 0) / 100) * paidAmount;
      const restockFeeFromPercent =
        (Number(restockingFeePercent || 0) / 100) * paidAmount;

      const totalFees =
        Number(cancellationFee || 0) +
        Number(cancelFeeFromPercent || 0) +
        Number(restockingFee || 0) +
        Number(restockFeeFromPercent || 0) +
        (nonRefundableShipping ? Number(shippingCharge || 0) : 0);

      const refundable = Math.max(0, Number(paidAmount || 0) - totalFees);

      // round to 2 decimals
      return Math.round(refundable * 100) / 100;
    }

    // Convenience: original payment info
    const originalPaymentStatus =
      order.payment && order.payment.status
        ? String(order.payment.status).toLowerCase()
        : null;
    const originalPaymentMethod =
      order.payment && order.payment.method
        ? String(order.payment.method).toLowerCase()
        : null;

    // -----------------------
    // CANCELLATION (allowed only in allowed statuses)
    // -----------------------
    if (requestedStatus === "cancelled" || requestedStatus === "canceled") {
      // if already cancelled, return success
      if (curStatus === "cancelled" || curStatus === "canceled") {
        return json(
          { success: true, message: "Order already cancelled", data: order },
          200
        );
      }

      // Allowed statuses for cancellation
      const allowedAutoCancel = [
        "pending",
        "pending",
        "confirmed",
        "processing",
        "packed",
      ];

      if (!allowedAutoCancel.includes(curStatus)) {
        // Disallow cancellation from out_for_delivery, shipped, delivered, etc.
        return json(
          {
            success: false,
            error: `Order cannot be cancelled from status "${
              order.status
            }". Allowed statuses: ${allowedAutoCancel.join(", ")}.`,
          },
          400
        );
      }

      // Build cancellation metadata
      const cancellationReason =
        body.cancellationReason || body.reason || "Cancelled by user";
      setData.status = "cancelled";
      setData.cancellationReason = cancellationReason;
      setData["invoice.meta.orderStatus"] = "cancelled";
      setData["invoice.meta.cancellationReason"] = cancellationReason;
      setData["invoice.meta.cancellationAt"] = new Date();

      // --- REFUND AMOUNT LOGIC ---
      const cancellationFee = Number(body.cancellationFee ?? 0);
      const cancellationFeePercent = Number(body.cancellationFeePercent ?? 0);
      const restockingFee = Number(body.restockingFee ?? 0);
      const restockingFeePercent = Number(body.restockingFeePercent ?? 0);
      const nonRefundableShipping = !!body.nonRefundableShipping;

      // Refund only if original order.payment.status === 'paid'
      let refundAmount = 0;
      if (originalPaymentStatus === "paid") {
        refundAmount = computeRefundAmount({
          orderDoc: order,
          cancellationFee,
          cancellationFeePercent,
          restockingFee,
          restockingFeePercent,
          nonRefundableShipping,
        });

        // If client provided refundAmount, ensure it matches server's computed amount (prevent tampering)
        const clientRefundAmount =
          body.refundAmount ?? (body.payment && body.payment.refundAmount);
        if (
          typeof clientRefundAmount === "number" &&
          Math.abs(clientRefundAmount - refundAmount) > 0.01
        ) {
          return json(
            {
              success: false,
              error: `Invalid refundAmount. Expected ${refundAmount} based on order totals and fees.`,
              expectedRefundAmount: refundAmount,
              provided: clientRefundAmount,
            },
            400
          );
        }

        setData["payment.refundAmount"] = refundAmount;
        setData["invoice.meta.refundAmount"] = refundAmount;
        setData["invoice.meta.refundDeductions"] = {
          cancellationFee,
          cancellationFeePercent,
          restockingFee,
          restockingFeePercent,
          nonRefundableShipping,
        };

        if (body.forceImmediateRefund) {
          // Simulated refund — replace with real gateway call
          const simulatedRefundTx =
            body.refundTransactionId || `RFND-${Date.now()}`;
          setData["payment.status"] = "refunded";
          setData["payment.refundTransactionId"] = simulatedRefundTx;
          setData["payment.refundAt"] = new Date();
          setData["payment.refundAmount"] = refundAmount;
          setData["invoice.meta.paymentStatus"] = "refunded";
          setData["invoice.meta.refundTransactionId"] = simulatedRefundTx;
        } else {
          setData["payment.status"] = "refund_pending";
          setData["payment.refundAmount"] = refundAmount;
          setData["invoice.meta.paymentStatus"] = "refund_pending";
        }
      } else {
        // Payment not paid (includes COD) -> explicit: no refund
        setData["payment.refundAmount"] = 0;
        // preserve existing payment.status (don't override to refunded)
        setData["payment.status"] =
          order.payment && order.payment.status
            ? order.payment.status
            : "not_paid";
      }

      // Restock behavior (default true)
      const doRestock = body.restock === false ? false : true;

      if (Object.keys(setData).length > 0) update.$set = setData;

      const res = await Order.collection.updateOne({ _id: order._id }, update);
      if (res.matchedCount === 0)
        return json({ success: false, error: "Order not found" }, 404);

      // perform restock after DB update
      if (doRestock) {
        const restockPromises = (order.items || [])
          .map((it) => {
            if (it.product && it.quantity) {
              return Product.updateOne(
                { _id: it.product },
                { $inc: { stockQuantity: Number(it.quantity) } }
              );
            }
            return null;
          })
          .filter(Boolean);
        if (restockPromises.length) await Promise.all(restockPromises);
      }

      // trigger refund worker / gateway asynchronously if needed
      const updated = await Order.findById(order._id).lean();

      await logger({
        level: 'info',
        message: `Order cancelled successfully: ${order._id}`,
        action: 'ORDER_CANCELLED',
        userId: body.userId || order.user,
        metadata: {
          orderId: order._id,
          reason: cancellationReason,
          refundAmount: updated.payment?.refundAmount || 0,
          paymentMethod: originalPaymentMethod,
          paymentStatus: originalPaymentStatus
        },
        req: request
      });

      return json(
        { success: true, message: "Order cancelled", data: updated },
        200
      );
    }

    // -----------------------
    // RETURNS (request and finalize)
    // -----------------------
    if (
      requestedStatus === "return_requested" ||
      requestedStatus === "returned"
    ) {
      // return_requested allowed only when current status is 'delivered'
      if (requestedStatus === "return_requested") {
        if (curStatus !== "delivered") {
          return json(
            {
              success: false,
              error: `Return requests are allowed only when order status is "delivered". Current status: "${order.status}".`,
            },
            400
          );
        }

        // mark request
        setData.status = "return_requested";
        setData["invoice.meta.returnRequestedAt"] = new Date();
        setData.returnReason = body.returnReason || null;
        setData["invoice.meta.orderStatus"] = "return_requested";

        // set returnRequest flags for audit / frontend
        setData["returnRequest.isRequested"] = true;
        setData["returnRequest.requestedAt"] = new Date();
        if (body.requestedBy)
          setData["returnRequest.requestedBy"] = body.requestedBy;
        if (body.requestMetadata)
          setData["returnRequest.requestMetadata"] = body.requestMetadata;

        if (Object.keys(setData).length > 0) update.$set = setData;
        const r = await Order.collection.updateOne({ _id: order._id }, update);
        if (r.matchedCount === 0)
          return json({ success: false, error: "Order not found" }, 404);

        const updated = await Order.findById(order._id).lean();
        
        await logger({
          level: 'info',
          message: `Return requested for order: ${order._id}`,
          action: 'ORDER_RETURN_REQUESTED',
          userId: body.userId || order.user,
          metadata: {
            orderId: order._id,
            reason: setData.returnReason || null,
            paymentMethod: originalPaymentMethod,
            paymentStatus: originalPaymentStatus
          },
          req: request
        });

        return json(
          { success: true, message: "Return requested", data: updated },
          200
        );
      }

      // requestedStatus === 'returned' — finalize return
      // Accept finalization only if current status is 'delivered' or already 'return_requested'
      if (!(curStatus === "delivered" || curStatus === "return_requested")) {
        return json(
          {
            success: false,
            error: `Cannot finalize return when order status is "${order.status}". Allowed: "delivered" or "return_requested".`,
          },
          400
        );
      }

      // finalize return metadata
      setData.status = "returned";
      setData["invoice.meta.returnedAt"] = new Date();
      setData.returnReason =
        body.returnReason || body.returnResolution?.reason || null;
      setData["invoice.meta.orderStatus"] = "returned";

      // clear/resolve returnRequest
      setData["returnRequest.isRequested"] = false;
      setData["returnRequest.resolvedAt"] = new Date();

      // record resolution if provided
      if (body.returnResolution) {
        setData["returnRequest.resolution"] = {
          status: body.returnResolution.status || "completed",
          refundAmount:
            typeof body.returnResolution.refundAmount === "number"
              ? Number(body.returnResolution.refundAmount)
              : undefined,
          resolutionNote:
            body.returnResolution.resolutionNote ||
            body.returnResolution.note ||
            null,
          resolvedBy:
            body.returnResolution.resolvedBy || body.changedBy || null,
          meta: body.returnResolution.meta || null,
          resolvedAt: new Date(),
        };
      } else if (body.changedBy) {
        setData["returnRequest.resolution"] = {
          status: "completed",
          refundAmount: undefined,
          resolutionNote: null,
          resolvedBy: body.changedBy,
          meta: null,
          resolvedAt: new Date(),
        };
      }

      // --- REFUND logic only if original payment was 'paid' ---
      const cancellationFee = Number(body.cancellationFee ?? 0);
      const cancellationFeePercent = Number(body.cancellationFeePercent ?? 0);
      const restockingFee = Number(body.restockingFee ?? 0);
      const restockingFeePercent = Number(body.restockingFeePercent ?? 0);
      const nonRefundableShipping = !!body.nonRefundableShipping;

      if (originalPaymentStatus === "paid") {
        const refundAmount = computeRefundAmount({
          orderDoc: order,
          cancellationFee,
          cancellationFeePercent,
          restockingFee,
          restockingFeePercent,
          nonRefundableShipping,
        });

        // If client-provided refund amount in returnResolution, validate match
        const clientRefundAmount =
          body.returnResolution &&
          typeof body.returnResolution.refundAmount === "number"
            ? body.returnResolution.refundAmount
            : typeof body.refundAmount === "number"
            ? body.refundAmount
            : undefined;

        if (
          typeof clientRefundAmount === "number" &&
          Math.abs(clientRefundAmount - refundAmount) > 0.01
        ) {
          return json(
            {
              success: false,
              error: `Invalid refundAmount for return. Expected ${refundAmount} based on order totals and fees.`,
              expectedRefundAmount: refundAmount,
              provided: clientRefundAmount,
            },
            400
          );
        }

        setData["payment.refundAmount"] = refundAmount;
        setData["invoice.meta.refundAmount"] = refundAmount;
        setData["invoice.meta.refundDeductions"] = {
          cancellationFee,
          cancellationFeePercent,
          restockingFee,
          restockingFeePercent,
          nonRefundableShipping,
        };

        if (
          body.forceImmediateRefund ||
          (body.returnResolution && body.returnResolution.forceImmediateRefund)
        ) {
          const simulatedRefundTx =
            body.refundTransactionId || `RFND-${Date.now()}`;
          setData["payment.status"] = "refunded";
          setData["payment.refundTransactionId"] = simulatedRefundTx;
          setData["payment.refundAt"] = new Date();
          setData["payment.refundAmount"] = refundAmount;
          setData["invoice.meta.paymentStatus"] = "refunded";
          setData["invoice.meta.refundTransactionId"] = simulatedRefundTx;
        } else {
          setData["payment.status"] = "refund_pending";
          setData["payment.refundAmount"] = refundAmount;
          setData["invoice.meta.paymentStatus"] = "refund_pending";
        }
      } else {
        // COD/unpaid -> no refund
        setData["payment.refundAmount"] = 0;
        setData["payment.status"] =
          order.payment && order.payment.status
            ? order.payment.status
            : "not_paid";
      }

      // Restock default behavior
      const doRestock = body.restock === false ? false : true;
      if (Object.keys(setData).length > 0) update.$set = setData;

      const res = await Order.collection.updateOne({ _id: order._id }, update);
      if (res.matchedCount === 0)
        return json({ success: false, error: "Order not found" }, 404);

      if (doRestock) {
        const restockPromises = (order.items || [])
          .map((it) => {
            if (it.product && it.quantity) {
              return Product.updateOne(
                { _id: it.product },
                { $inc: { stock: Number(it.quantity) } }
              );
            }
            return null;
          })
          .filter(Boolean);
        if (restockPromises.length) await Promise.all(restockPromises);
      }

      const updated = await Order.findById(order._id).lean();

      await logger({
        level: 'info',
        message: `Order returned successfully: ${order._id}`,
        action: 'ORDER_RETURNED',
        userId: body.userId || order.user,
        metadata: {
          orderId: order._id,
          reason: setData.returnReason || null,
          refundAmount: updated.payment?.refundAmount || 0,
          paymentMethod: originalPaymentMethod,
          paymentStatus: originalPaymentStatus
        },
        req: request
      });

      return json(
        { success: true, message: "Order returned", data: updated },
        200
      );
    }

    // -----------------------
    // FALLBACK: other updates (payment, delivery, notes, generic status changes)
    // -----------------------

    // Prevent direct setting of cancellation/return statuses via fallback path
    if ("status" in body) {
      const prohibitedDirect = [
        "cancelled",
        "canceled",
        "returned",
        "return_requested",
      ];
      if (prohibitedDirect.includes(String(body.status).toLowerCase())) {
        return json(
          {
            success: false,
            error: `Please use the designated cancellation/return flow to set status "${body.status}".`,
          },
          400
        );
      }
      setData.status = body.status;
      setData["invoice.meta.orderStatus"] = body.status;
    }

    // --- DEPARTMENT UPDATES ---
    if ("department" in body) {
      const newDept = body.department;
      const oldDept = order.department;
      
      if (newDept !== oldDept) {
        setData.department = newDept;
        
        // Push to departmentHistory
        const historyEntry = {
          from: oldDept,
          to: newDept,
          updatedBy: body.changedBy || body.userId || null, // Assuming one of these might be present
          updatedAt: new Date(),
          notes: body.departmentNotes || body.notes || ""
        };
        
        if (!update.$push) update.$push = {};
        update.$push.departmentHistory = historyEntry;
      }
    }


    // --- IMPORTANT PAYMENT SANITY CHECKS ---
    // Prevent clients from arbitrarily writing payment.status = 'refunded' or 'refund_pending'
    // unless this request was processed by the above cancel/return flows.
    if ("paymentStatus" in body || (body.payment && "status" in body.payment)) {
      const attempted = (body.paymentStatus ?? body.payment.status)
        .toString()
        .toLowerCase();
      if (attempted === "refunded" || attempted === "refund_pending") {
        return json(
          {
            success: false,
            error: `Directly setting payment status to "${attempted}" is not allowed. Use cancellation / return flows which validate refunds.`,
          },
          400
        );
      } else {
        // allow other safe statuses (paid, pending, failed)
        setData["payment.status"] = body.paymentStatus ?? body.payment.status;
        setData["invoice.meta.paymentStatus"] =
          body.paymentStatus ?? body.payment.status;
        if (
          (body.paymentStatus ?? body.payment.status) === "paid" &&
          !body.paymentPaidAt
        ) {
          setData["payment.paidAt"] = new Date();
          setData["invoice.meta.paidAt"] = new Date();
        }
      }
    }

    if (body.payment && typeof body.payment === "object") {
      if ("method" in body.payment)
        setData["payment.method"] = body.payment.method;
      if ("amount" in body.payment)
        setData["payment.amount"] = Number(body.payment.amount);
      // Do NOT accept client-sent refundAmount here — refunds only through cancel/return flows
    }

    if ("paymentMethod" in body) {
      setData["payment.method"] = body.paymentMethod;
      setData["invoice.meta.paymentMethod"] = body.paymentMethod;
    }

    if (body.delivery && typeof body.delivery === "object") {
      if ("status" in body.delivery) {
        setData["delivery.status"] = body.delivery.status;
        setData["invoice.meta.deliveryStatus"] = body.delivery.status;

        if (body.delivery.status === "delivered") {
          const deliveredAt = body.delivery.deliveredAt
            ? new Date(body.delivery.deliveredAt)
            : new Date();
          setData["invoice.meta.deliveredAt"] = deliveredAt;
          setData["delivery.meta"] = {
            ...(body.delivery.meta || {}),
            deliveredAt,
          };
        }
      }
      if ("trackingNumber" in body.delivery)
        setData["delivery.trackingNumber"] = body.delivery.trackingNumber;
      if ("eta" in body.delivery)
        setData["delivery.eta"] = body.delivery.eta
          ? new Date(body.delivery.eta)
          : null;
    }

    if ("cancellationReason" in body) {
      setData.cancellationReason = body.cancellationReason;
      setData["invoice.meta.cancellationReason"] = body.cancellationReason;
    }

    if ("notes" in body && typeof body.notes === "string") {
      setData.notes = body.notes.trim();
      setData["invoice.meta.notes"] = body.notes.trim();
    }

    if (Object.keys(setData).length > 0) update.$set = setData;
    if (!update.$set) {
      return json(
        { success: false, error: "No updatable fields in request body" },
        400
      );
    }

    // --- CRITICAL: EXECUTE THE UPDATE ---
    const result = await Order.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(idParam) },
      update
    );

    if (result.matchedCount === 0) {
      return json({ success: false, error: "Order not found" }, 404);
    }

    // 🔥 THE MARKETPLACE SETTLEMENT ENGINE: Settle for EVERY Supplier in the order
    const finalState = await Order.findById(idParam).lean();
    if (!finalState) return json({ success: false, error: "Order lost" }, 404);

    const isDelivered = (finalState.status || "").toLowerCase() === "delivered" || (finalState.delivery?.status || "").toLowerCase() === "delivered";
    const isPaid = (finalState.payment?.status || "").toLowerCase() === "paid";
    
    console.log(`[PATCH SETTLEMENT] Flow: Update Trigger | Del: ${isDelivered} | Paid: ${isPaid}`);

    if (isDelivered && isPaid) {
      try {
        const Wallet = (await import("@/lib/db/models/wallet")).default;
        const Transaction = (await import("@/lib/db/models/transaction")).default;

        // 🟢 IDENTIFY UNIQUE SUPPLIERS
        const suppliers = new Set();
        if (finalState.supplier) suppliers.add(finalState.supplier.toString());
        (finalState.items || []).forEach(item => {
           if (item.supplier) suppliers.add(item.supplier.toString());
        });
        console.log(`[PATCH SETTLEMENT] Marketplace Suppliers in Order: ${[...suppliers].join(', ')}`);

        for (const sId of suppliers) {
          const supplierId = new mongoose.Types.ObjectId(sId);
          
          let wallet = await Wallet.findOne({ userId: supplierId });
          if (!wallet) {
            wallet = new Wallet({ userId: supplierId, balance: 0, userType: 'supplier' });
          }

          // 1) Settle items belonging to this specific supplier
          const supplierTotal = (finalState.items || [])
            .filter(item => item.supplier?.toString() === sId)
            .reduce((sum, item) => sum + (item.totalPrice || 0), 0);

          if (supplierTotal > 0) {
            const existingTx = await Transaction.findOne({ 
              "metadata.orderId": finalState._id, 
              userId: supplierId,
              type: "order_settlement" 
            });

            if (!existingTx) {
              console.log(`[PATCH SETTLEMENT] AWARDING ₹${supplierTotal} to Vendor ${sId}`);
              const settlementTx = new Transaction({
                userId: supplierId,
                walletId: wallet._id,
                amount: supplierTotal,
                type: "order_settlement", 
                method: "wallet",
                status: "completed",
                description: `Settlement for Order Items: ${finalState.orderNumber}`,
                metadata: { orderId: finalState._id, orderNumber: finalState.orderNumber }
              });
              await settlementTx.save();
            } else {
              console.log(`[PATCH SETTLEMENT] Vendor ${sId} already credited. Skipping.`);
            }
          }

          // 2) Force Live Sync for this supplier (Marketplace Aware)
          const metrics = await Order.aggregate([
            { $match: { 
                 $or: [
                   { supplier: supplierId },
                   { "items.supplier": supplierId }
                 ]
            } },
            { $unwind: "$items" },
            {
               $group: {
                 _id: null,
                 realized: { $sum: { $cond: [{ $and: [{ $eq: ["$items.supplier", supplierId] }, { $eq: ["$status", "delivered"] }, { $eq: ["$payment.status", "paid"] }] }, "$items.totalPrice", 0] } },
                 escrowed: { $sum: { $cond: [{ $and: [{ $eq: ["$items.supplier", supplierId] }, { $in: ["$status", ["pending", "confirmed", "packed", "shipped", "out_for_delivery"]] }] }, "$items.totalPrice", 0] } }
               }
            }
          ]);

          const snap = metrics[0] || { realized: 0, escrowed: 0 };
          
          const ledgerTruth = await Transaction.aggregate([
            { $match: { userId: supplierId, status: 'completed' } },
            {
              $group: {
                _id: null,
                balance: { 
                  $sum: { 
                    $cond: [
                      { $in: ["$type", ["deposit", "refund", "transfer", "order_settlement", "adjustment"]] }, 
                      { $abs: "$amount" }, 
                      { $multiply: [{ $abs: "$amount" }, -1] } // Always subtract debits
                    ] 
                  } 
                }
              }
            }
          ]);

          wallet.balance = ledgerTruth[0]?.balance || 0;
          wallet.realizedSavings = snap.realized;
          wallet.escrowedPoints = snap.escrowed;
          await wallet.save();
          console.log(`[PATCH SETTLEMENT] SYNC COMPLETE for Vendor ${sId} | Balance: ₹${wallet.balance} | Escrow: ₹${wallet.escrowedPoints}`);
        }
      } catch (e) {
        console.error("[PATCH SETTLEMENT] Marketplace Loop Failure:", e);
      }
    }

    return json({ success: true, message: "Multi-supplier settlement handled", data: finalState });

  } catch (err) {
    console.error("PATCH /api/order error:", err);
    return json({ success: false, error: err.message || "Server error" }, 500);
  }
}
