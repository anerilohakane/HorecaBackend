import Claim from "@/lib/db/models/Claim";
import Order from "@/lib/db/models/order";
import User from "@/lib/db/models/User";
import Notification from "@/lib/db/models/notification";

export async function notifyODTTeam(orderId) {
  try {
    if (!orderId) return;

    const order = await Order.findById(orderId);
    if (!order) {
      console.warn(`[NOTIFY_ODT] Order not found for ID: ${orderId}`);
      return;
    }

    const claims = await Claim.find({ orderId });
    if (claims.length === 0) return;

    const approvedCount = claims.filter(c => c.status === "APPROVED").length;
    const rejectedCount = claims.filter(c => c.status === "REJECTED").length;
    const pendingCount = claims.filter(c => ["REQUESTED", "PENDING"].includes(c.status)).length;

    const parts = [];
    if (approvedCount > 0) {
      parts.push(`${approvedCount} product claim${approvedCount > 1 ? "s" : ""} approved`);
    }
    if (rejectedCount > 0) {
      parts.push(`${rejectedCount} product claim${rejectedCount > 1 ? "s" : ""} rejected`);
    }
    if (pendingCount > 0) {
      parts.push(`${pendingCount} product claim${pendingCount > 1 ? "s" : ""} pending`);
    }

    const message = `${parts.join(", ")} for Order #${order.orderNumber}`;

    // Find users belonging to SCM/ODT or having admin/manager roles
    const users = await User.find({
      $or: [
        { department: { $in: ["ODT", "SCM", "odt", "scm"] } },
        { role: { $in: ["admin", "manager"] } }
      ],
      isActive: true
    });

    if (users.length === 0) {
      console.warn("[NOTIFY_ODT] No active SCM/ODT/admin users found to notify.");
      return;
    }

    // Create notifications
    const notificationPromises = users.map(user => {
      return Notification.create({
        user: user._id,
        title: `Claim Update: Order ${order.orderNumber}`,
        message,
        type: rejectedCount > 0 ? "warning" : "success",
        metadata: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          approvedCount,
          rejectedCount,
          pendingCount
        }
      });
    });

    await Promise.all(notificationPromises);
    console.log(`[NOTIFY_ODT] Sent notification to ${users.length} user(s): "${message}"`);
  } catch (error) {
    console.error("[NOTIFY_ODT] Error sending claim notifications:", error);
  }
}
