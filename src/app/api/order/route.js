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
    if (sp && sp.options && sp.options.ref) return sp.options.ref;

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
          return casterSchema.path(subPath).options.ref;
        }
      }
    }

    // as a fallback, try reading options.ref from nested path string directly
    const nested = Order.schema.path(p);
    if (nested && nested.options && nested.options.ref)
      return nested.options.ref;

    return null;
  }

  const refModel = resolveRefForPath(path);

  if (!refModel) {
    // no ref defined in schema for this path -> don't populate
    // but still attempt to call populate (it will no-op), however to avoid strictPopulate error, skip it.
    console.warn(
      `[safePopulate] No ref found in Order.schema for path "${path}" — skipping populate.`
    );
    return query;
  }

  if (!registered.includes(refModel)) {
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

    // 1) userId (or user)
    const userId = body.userId || body.user;
    if (!userId) {
      return json({ success: false, error: "userId is required" }, 400);
    }

    // const user = await User.findById(userId);
    // if (!user) {
    //   return json({ success: false, error: "User not found" }, 404);
    // }

    let user = await User.findById(userId);
    if (!user) {
      user = await Customer.findById(userId);
    }

    if (!user) {
      return json({ success: false, error: "Customer/User not found" }, 404);
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
    const tax = Number(body.tax ?? 0);
    const shippingCharges = Number(body.shippingCharges ?? 0);
    const discounts = Number(body.discounts ?? 0);
    const total = subtotal + tax + shippingCharges - discounts;

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
      }
    }

    // 8) Build orderDoc according to your OrderSchema
    const orderDoc = new Order({
      user: user._id,
      supplier: supplierRef,
      items: builtItems,
      
      shippingAddress: shippingAddress,

      subtotal,
      tax,
      shippingCharges,
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
        tax,
        shippingCharges,
        discounts,
        total,
        currency: orderDoc.currency,
        notes: body.invoiceNotes || "",
        paymentMethod,
        paymentStatus,
        paidAt: paidAt || null,
      },
    };

    // 10) Save
    await orderDoc.save();

    // 11) Optional stock decrement (Default to TRUE unless explicitly false)
    if (body.decrementStock !== false) {
      for (const it of builtItems) {
        if (typeof it.quantity === "number" && it.quantity > 0) {
          await Product.updateOne(
            { _id: it.product },
            { $inc: { stockQuantity: -it.quantity } }
          );
        }
      }
    }

    return json({ success: true, order: orderDoc }, 201);
  } catch (err) {
    console.error("POST /api/order error:", err);
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

    /* -----------------------------
       FETCH ALL ORDERS FOR A USER
    ------------------------------*/
    const userId =
      url.searchParams.get("userId") || url.searchParams.get("user");

    if (!userId) {
      return json(
        { success: false, error: "userId is required to fetch orders" },
        400
      );
    }

    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(100, Number(url.searchParams.get("limit") || 20));
    const skip = (page - 1) * limit;

    const q = { user: userId };

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

    const result = await Order.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(idParam) },
      update
    );

    if (result.matchedCount === 0) {
      return json({ success: false, error: "Order not found" }, 404);
    }

    const updated = await Order.findById(idParam).lean();
    if (!updated)
      return json(
        { success: false, error: "Order not found after update" },
        404
      );

    return json({ success: true, data: updated }, 200);
  } catch (err) {
    console.error("PATCH /api/orders error:", err);
    return json({ success: false, error: err.message || "Server error" }, 500);
  }
}
