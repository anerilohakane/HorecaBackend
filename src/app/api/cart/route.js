import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Cart from "@/lib/db/models/cart";
import Product from "@/lib/db/models/product";
import Customer from "@/lib/db/models/customer";
import { logger } from "@/lib/logger";
import { getUserFromRequest } from "@/lib/serverAuth";

async function recalculateCart(cart, userId) {
  const customer = await Customer.findById(userId).lean();
  const customerCategory = customer?.category || "D";

  let total = 0;
  for (const item of cart.items) {
    const p = item.productId;
    if (p && typeof p === "object" && p.price !== undefined) {
      let displayPrice = p.price;
      if (customerCategory && p.categoryPrices && p.categoryPrices[customerCategory] > 0) {
        displayPrice = p.categoryPrices[customerCategory];
      }
      item.price = displayPrice;
      item.gst = p.gst || 0;
      item.name = p.name;
      item.unit = p.unit;
      total += displayPrice * item.quantity;
    } else {
      const product = await Product.findById(item.productId).lean();
      if (product) {
        let displayPrice = product.price;
        if (customerCategory && product.categoryPrices && product.categoryPrices[customerCategory] > 0) {
          displayPrice = product.categoryPrices[customerCategory];
        }
        item.price = displayPrice;
        item.gst = product.gst || 0;
        item.name = product.name;
        item.unit = product.unit;
        total += displayPrice * item.quantity;
      } else {
        total += (item.price || 0) * item.quantity;
      }
    }
  }
  cart.subtotal = total;
  cart.updatedAt = new Date();
  cart.markModified('items');
  await cart.save();
}

export async function GET(req) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId required" },
        { status: 400 }
      );
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      return NextResponse.json({
        success: true,
        data: { userId, items: [], subtotal: 0 },
      });
    }

    // Dynamic Recalculation
    await recalculateCart(cart, userId);

    // Re-fetch populated cart
    const populatedCart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        model: Product,
      })
      .exec();

    // 🔥 Format items cleanly for frontend
    const formattedItems = populatedCart.items.map((item) => {
      const p = item.productId; // populated product

      return {
        productId: p?._id?.toString(),
        quantity: item.quantity,
        name: item.name,
        price: item.price,
        unit: item.unit,
        gst: item.gst || 0,
        product: {
          id: p?._id?.toString(),
          name: p?.name,
          price: p?.price,
          unit: p?.unit,
          gst: p?.gst || 0,
          image:
            p?.images?.[0]?.url ||
            p?.image ||
            "/images/placeholder-product.png",
          stockQuantity: p?.stockQuantity,
          categoryPrices: p?.categoryPrices,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        userId,
        items: formattedItems,
        subtotal: populatedCart.subtotal,
      },
    });
  } catch (err) {
    console.error("GET /api/cart error", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * body: { userId, productId, quantity }
 * Adds item (or increases quantity if exists)
 */
export async function POST(request) {
  await dbConnect();
  try {
    const body = await request.json();

    console.log(body);
    
    const userId = body.userId;
    const productId = body.productId;
    const quantity = Math.max(1, parseInt(body.quantity || "1", 10));

    if (!userId || !productId) return NextResponse.json({ success: false, error: "userId and productId required" }, { status: 400 });

    const product = await Product.findById(productId).lean();
    if (!product) return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });

    // If quantity > stock, enforce limit (optional)
    if (product.stockQuantity != null && quantity > product.stockQuantity) {
      return NextResponse.json({ success: false, error: "Requested quantity exceeds available stock" }, { status: 400 });
    }

    const customer = await Customer.findById(userId).lean();
    const customerCategory = customer?.category || "D";
    let displayPrice = product.price;

    if (customerCategory && product.categoryPrices && product.categoryPrices[customerCategory]) {
      displayPrice = product.categoryPrices[customerCategory];
    }

    // Upsert cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      const item = {
        productId,
        quantity,
        name: product.name,
        price: displayPrice,
        thumbnail: product.images?.[0]?.url || "",
        unit: product.unit,
        gst: product.gst || 0
      };
      const newCart = new Cart({ userId, items: [item], subtotal: displayPrice * quantity, updatedAt: new Date() });
      await newCart.save();
      await recalculateCart(newCart, userId);
      return NextResponse.json({ success: true, data: newCart }, { status: 201 });
    }

    // if exists, update qty, else push
    const existingIndex = cart.items.findIndex(i => String(i.productId) === String(productId));
    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
      // update price/gst snapshots just in case
      cart.items[existingIndex].price = displayPrice;
      cart.items[existingIndex].gst = product.gst || 0;
      // clamp to stock if needed
      if (product.stockQuantity != null && cart.items[existingIndex].quantity > product.stockQuantity) {
        cart.items[existingIndex].quantity = product.stockQuantity;
      }
    } else {
      cart.items.push({
        productId,
        quantity,
        name: product.name,
        price: displayPrice,
        thumbnail: product.images?.[0]?.url || "",
        unit: product.unit,
        gst: product.gst || 0
      });
    }

    await recalculateCart(cart, userId);

    await logger({ level: 'info', message: `Added to cart: ${productId} (qty: ${quantity})`, action: 'CART_ADD', userId, metadata: { productId, quantity, totalItems: cart.items.length }, req: request });

    return NextResponse.json({ success: true, data: cart });
  } catch (err) {
    console.error("POST /api/cart error", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/cart
 * body: { userId, productId, quantity }  -- set quantity (if quantity === 0 remove)
 */
export async function PATCH(request) {
  await dbConnect();
  try {
    const body = await request.json();

    console.log(body);
    
    const userId = body.userId;
    const productId = body.productId;
    if (!userId || !productId) return NextResponse.json({ success: false, error: "userId and productId required" }, { status: 400 });

    const qty = typeof body.quantity !== "undefined" ? parseInt(body.quantity, 10) : null;
    if (qty != null && qty < 0) return NextResponse.json({ success: false, error: "Invalid quantity" }, { status: 400 });

    let cart = await Cart.findOne({ userId });
    if (!cart) return NextResponse.json({ success: false, error: "Cart not found" }, { status: 404 });

    const idx = cart.items.findIndex(i => String(i.productId) === String(productId));
    if (idx === -1) return NextResponse.json({ success: false, error: "Item not in cart" }, { status: 404 });

    if (qty === 0) {
      cart.items.splice(idx, 1);
    } else if (qty != null) {
      // Check stock if needed
      const product = await Product.findById(productId).lean();
      if (product && product.stockQuantity != null && qty > product.stockQuantity) {
        return NextResponse.json({ success: false, error: "Requested quantity exceeds available stock" }, { status: 400 });
      }
      cart.items[idx].quantity = qty;
    } else if (body.increment) {
      cart.items[idx].quantity += 1;
    } else if (body.decrement) {
      cart.items[idx].quantity = Math.max(1, cart.items[idx].quantity - 1);
    } else {
      return NextResponse.json({ success: false, error: "No update action specified" }, { status: 400 });
    }

    await recalculateCart(cart, userId);
    
    await logger({ level: 'info', message: `Updated cart item: ${productId}`, action: 'CART_UPDATE', userId, metadata: { productId, body }, req: request });

    return NextResponse.json({ success: true, data: cart });
  } catch (err) {
    console.error("PATCH /api/cart error", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/cart
 * body or query: { userId, productId }  -- removes a product from cart
 * if only userId provided and no productId -> clears cart
 */
export async function DELETE(request) {
  await dbConnect();
  try {
    const url = new URL(request.url);
    const queryUser = url.searchParams.get("userId");
    const queryProduct = url.searchParams.get("productId");
    let body = {};
    try { body = await request.json(); } catch(e){}

    const userId = body.userId || queryUser;
    const productId = body.productId || queryProduct;

    if (!userId) return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });

    let cart = await Cart.findOne({ userId });
    if (!cart) return NextResponse.json({ success: true, data: { userId, items: [] } });

    if (!productId) {
      // clear cart
      cart.items = [];
      cart.subtotal = 0;
      cart.updatedAt = new Date();
      await cart.save();
    } else {
      cart.items = cart.items.filter(i => String(i.productId) !== String(productId));
      await recalculateCart(cart, userId);
    }

    await logger({ 
      level: 'info', 
      message: productId ? `Removed from cart: ${productId}` : `Cleared cart`, 
      action: productId ? 'CART_REMOVE' : 'CART_CLEAR', 
      userId, 
      metadata: { productId }, 
      req: request 
    });

    return NextResponse.json({ success: true, data: cart });
  } catch (err) {
    console.error("DELETE /api/cart error", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
