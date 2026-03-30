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
      return NextResponse.json({ success: false, error: "Invalid userId format" }, { status: 400 });
    }

    const supplierId = new mongoose.Types.ObjectId(userId);

    // 1) DYNAMIC BALANCE CALCULATION (Flipkart/Amazon Style Ledger)
    // Balance = (All Settlements + Deposits + Refunds) - (All Payments + Withdrawals)
    const ledger = await Transaction.aggregate([
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
            $sum: { $cond: [{ $in: ["$type", ["deposit", "refund", "transfer", "order_settlement", "adjustment"]] }, "$amount", 0] }
          },
          totalOutflow: { 
            $sum: { $cond: [{ $in: ["$type", ["withdrawal", "order_payment"]] }, "$amount", 0] }
          }
        }
      }
    ]);

    const globalSum = ledger[0] || { totalInflow: 0, totalOutflow: 0 };
    const dynamicBalance = Math.max(0, globalSum.totalInflow - globalSum.totalOutflow);

    // 1.5) LIVE METRICS CALCULATION (For Synchronization)
    const orderMetrics = await Order.aggregate([
      { $match: { supplier: supplierId } },
      {
        $group: {
          _id: null,
          deliveredTotal: { 
            $sum: { $cond: [{ $and: [{ $eq: ["$status", "delivered"] }, { $eq: ["$payment.status", "paid"] }] }, "$total", 0] } 
          },
          pendingTotal: { 
            $sum: { $cond: [{ $in: ["$status", ["pending", "confirmed", "packed", "shipped", "out_for_delivery"]] }, "$total", 0] } 
          }
        }
      }
    ]);
    const metrics = orderMetrics[0] || { deliveredTotal: 0, pendingTotal: 0 };

    // 2) SYNC & PERSIST SNAPSHOTS (Source of Truth Stabilization)
    let wallet = await Wallet.findOne({ userId: supplierId });
    if (!wallet) {
      wallet = new Wallet({ 
        userId: supplierId, 
        balance: dynamicBalance, 
        realizedSavings: metrics.deliveredTotal,
        escrowedPoints: metrics.pendingTotal,
        userType: 'supplier' 
      });
      await wallet.save();
    } else {
      let isChanged = false;
      if (wallet.balance !== dynamicBalance) {
        wallet.balance = dynamicBalance;
        isChanged = true;
      }
      if (wallet.realizedSavings !== metrics.deliveredTotal) {
        wallet.realizedSavings = metrics.deliveredTotal;
        isChanged = true;
      }
      if (wallet.escrowedPoints !== metrics.pendingTotal) {
        wallet.escrowedPoints = metrics.pendingTotal;
        isChanged = true;
      }
      if (isChanged) await wallet.save();
    }

    // 3) RECENT ACTIVITY
    const transactions = await Transaction.find({ userId: supplierId })
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        balance: wallet.balance, 
        currency: wallet.currency || "INR",
        status: wallet.status || "active",
        recentTransactions: transactions,
        metrics: {
          deliveredAmount: wallet.realizedSavings, // REALIZED SAVINGS PERSISTED
          pendingAmount: wallet.escrowedPoints      // ESCROWED POINTS PERSISTED
        }
      }
    });
  } catch (err) {
    console.error("GET /api/wallet error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
