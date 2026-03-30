import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Wallet from "@/lib/db/models/wallet";
import Transaction from "@/lib/db/models/transaction";
import Order from "@/lib/db/models/order";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Invalid userId registry format" }, { status: 400 });
    }

    const supplierId = new mongoose.Types.ObjectId(userId);

    // Upsert Wallet silently if missing
    let wallet = await Wallet.findOne({ userId: supplierId });
    if (!wallet) {
      wallet = new Wallet({ userId: supplierId, balance: 0, userType: 'supplier' });
      await wallet.save();
    }

    // Fetch recent 10 transactions
    const transactions = await Transaction.find({ userId: supplierId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Order Metrics (Delivered vs Pending)
    const orderMetrics = await Order.aggregate([
      { $match: { supplier: supplierId } },
      {
        $group: {
          _id: null,
          deliveredTotal: { 
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, "$total", 0] } 
          },
          pendingTotal: { 
            $sum: { 
              $cond: [
                { $in: ["$status", ["pending", "confirmed", "packed", "shipped", "out_for_delivery"]] }, 
                "$total", 
                0
              ] 
            } 
          }
        }
      }
    ]);

    const metrics = orderMetrics[0] || { deliveredTotal: 0, pendingTotal: 0 };

    // Dynamic Financial Analytics (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await Transaction.aggregate([
      { 
        $match: { 
          userId: supplierId,
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: null,
          totalInflow: { 
            $sum: { $cond: [{ $in: ["$type", ["deposit", "refund", "transfer"]] }, "$amount", 0] }
          },
          totalOutflow: { 
            $sum: { $cond: [{ $in: ["$type", ["withdrawal", "order_payment"]] }, "$amount", 0] }
          }
        }
      }
    ]);

    const flow = stats[0] || { totalInflow: 0, totalOutflow: 0 };

    return NextResponse.json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
        status: wallet.status,
        recentTransactions: transactions,
        metrics: {
          deliveredAmount: metrics.deliveredTotal,
          pendingAmount: metrics.pendingTotal
        },
        stats: {
          inflow: flow.totalInflow,
          outflow: flow.totalOutflow,
          netProfit: flow.totalInflow - flow.totalOutflow,
          period: "Last 30 Days"
        }
      }
    });
  } catch (err) {
    console.error("GET /api/wallet error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
