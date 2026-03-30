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


    // 1) DYNAMIC BALANCE CALCULATION (Ledger-based sum of all time)
    const allTransactions = await Transaction.aggregate([
      { 
        $match: { 
          userId: supplierId,
          status: 'completed'
        } 
      },
      {
        $group: {
          _id: null,
          totalInflow: { 
            // Money coming into the wallet
            $sum: { $cond: [{ $in: ["$type", ["deposit", "refund", "transfer", "order_settlement", "adjustment"]] }, "$amount", 0] }
          },
          totalOutflow: { 
            // Money leaving the wallet
            $sum: { $cond: [{ $in: ["$type", ["withdrawal", "order_payment"]] }, "$amount", 0] }
          }
        }
      }
    ]);

    const globalSum = allTransactions[0] || { totalInflow: 0, totalOutflow: 0 };
    const dynamicBalance = globalSum.totalInflow - globalSum.totalOutflow;

    // 1.5) SYNC BACK TO DB: Ensure static balance reflects the ledger truth
    if (wallet && wallet.balance !== dynamicBalance) {
      wallet.balance = dynamicBalance;
      await wallet.save();
    }

    // 2) DYNAMIC ORDER METRICS (Realized vs Escrowed)
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

    // 3) RECENT ACTIVITY (Last 10)
    const transactions = await Transaction.find({ userId: supplierId })
      .sort({ createdAt: -1 })
      .limit(10);

    // 4) 30-DAY ANALYTICS
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats30 = await Transaction.aggregate([
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
          in: { $sum: { $cond: [{ $in: ["$type", ["deposit", "refund", "transfer", "order_settlement", "adjustment"]] }, "$amount", 0] } },
          out: { $sum: { $cond: [{ $in: ["$type", ["withdrawal", "order_payment"]] }, "$amount", 0] } }
        }
      }
    ]);

    const flow30 = stats30[0] || { in: 0, out: 0 };

    return NextResponse.json({
      success: true,
      data: {
        balance: dynamicBalance, 
        currency: wallet?.currency || "INR",
        status: wallet?.status || "active",
        recentTransactions: transactions,
        metrics: {
          deliveredAmount: metrics.deliveredTotal, 
          pendingAmount: metrics.pendingTotal      
        },
        stats: {
          inflow: flow30.in,
          outflow: flow30.out,
          netProfit: flow30.in - flow30.out,
          period: "Last 30 Days"
        }
      }
    });
  } catch (err) {
    console.error("GET /api/wallet error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
