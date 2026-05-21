import mongoose from "mongoose";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/order";
import { 
  resolveDuplicateGroup, 
  scanAllOrdersForDuplicates 
} from "@/lib/services/duplicateOrderService";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function GET(request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const groupId = url.searchParams.get("groupId");
    const pending = url.searchParams.get("pending");

    if (groupId) {
      // Fetch details of a specific duplicate group
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return json({ success: false, error: "Invalid duplicateGroupId" }, 400);
      }

      const orders = await Order.find({ duplicateGroupId: new mongoose.Types.ObjectId(groupId) })
        .populate("user")
        .sort({ placedAt: 1 });

      return json({ success: true, orders });
    }

    // Default: Fetch all pending review duplicate groups
    const pendingOrders = await Order.find({
      duplicateGroupId: { $ne: null },
      duplicateStatus: "pending_review"
    })
      .populate("user")
      .sort({ placedAt: 1 })
      .lean();

    const groupsMap = {};
    pendingOrders.forEach(o => {
      if (!o.duplicateGroupId) return;
      const gid = o.duplicateGroupId.toString();
      if (!groupsMap[gid]) groupsMap[gid] = [];
      groupsMap[gid].push(o);
    });

    const groups = Object.keys(groupsMap).map(gid => {
      const orders = groupsMap[gid];
      // Find the master order in the group
      const master = orders.find(o => o.isDuplicateOrder === false) || orders[0];
      return {
        duplicateGroupId: gid,
        masterOrderId: master._id,
        customerName: master.shippingAddress?.fullName || master.user?.name || "Customer",
        total: master.total,
        orderCount: orders.length,
        orders: orders
      };
    });

    return json({ success: true, groups });
  } catch (err) {
    console.error("GET /api/order/duplicates error:", err);
    return json({ success: false, error: err.message }, 500);
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { action, groupId, targetOrderId, timeWindowHours } = body;

    if (action === "scan") {
      const hours = timeWindowHours || 168; // default 7 days
      const result = await scanAllOrdersForDuplicates(hours);
      return json({ success: true, result });
    }

    if (!groupId) {
      return json({ success: false, error: "groupId is required for resolution actions" }, 400);
    }

    const result = await resolveDuplicateGroup(groupId, action, targetOrderId);
    if (!result.success) {
      return json({ success: false, error: result.error }, 400);
    }

    return json({ success: true, message: result.message });
  } catch (err) {
    console.error("POST /api/order/duplicates error:", err);
    return json({ success: false, error: err.message }, 500);
  }
}
