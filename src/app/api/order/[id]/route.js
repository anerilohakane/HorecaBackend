import mongoose from "mongoose";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/order";
import Product from "@/lib/db/models/product";
import Supplier from "@/lib/db/models/supplier";
import User from "@/lib/db/models/User";
import Customer from "@/lib/db/models/customer";
import { logger } from "@/lib/logger";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function safePopulateQuery(query, path, select = "") {
  const registered = mongoose.modelNames();
  function resolveRefForPath(p) {
    const sp = Order.schema.path(p);
    if (!sp) return null;
    if (sp.options && sp.options.ref) return sp.options.ref;
    if (sp.options && sp.options.refPath) return "POLYMORPHIC";
    if (p.includes(".")) {
      const [arrPath, subPath] = p.split(".", 2);
      const arrSchemaPath = Order.schema.path(arrPath);
      if (arrSchemaPath && arrSchemaPath.caster) {
        const casterSchema = arrSchemaPath.caster.schema || arrSchemaPath.caster;
        if (casterSchema && casterSchema.path(subPath) && casterSchema.path(subPath).options) {
           const osp = casterSchema.path(subPath).options;
           if (osp.ref) return osp.ref;
           if (osp.refPath) return "POLYMORPHIC";
        }
      }
    }
    return null;
  }
  const refModel = resolveRefForPath(path);
  if (!refModel) return query;
  if (refModel !== "POLYMORPHIC" && !registered.includes(refModel)) return query;
  return query.populate(path, select);
}

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return json({ success: false, error: "Invalid orderId" }, 400);
    }

    let query = Order.findById(id);
    query = safePopulateQuery(query, "user", "name email phone address city state pincode");
    query = safePopulateQuery(query, "supplier", "name");
    query = safePopulateQuery(query, "items.product", "name price sku");

    const order = await query.lean();

    if (!order) {
      return json({ success: false, error: "Order not found" }, 404);
    }

    return json({ success: true, order }, 200);
  } catch (err) {
    console.error("GET /api/order/[id] error:", err);
    return json({ success: false, error: err.message || "Server error" }, 500);
  }
}
