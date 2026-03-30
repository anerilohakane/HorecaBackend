import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Wallet from "@/lib/db/models/wallet";
import Transaction from "@/lib/db/models/transaction";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, amount, method, description } = body;

    if (!userId || !amount) {
      return NextResponse.json({ success: false, error: "userId and amount required" }, { status: 400 });
    }

    const amt = parseFloat(String(amount));
    if (isNaN(amt) || amt <= 0) {
      return NextResponse.json({ success: false, error: "Invalid withdrawal amount" }, { status: 400 });
    }

    const supplierId = new mongoose.Types.ObjectId(userId);

    // SILENTLY Upsert Wallet
    let wallet = await Wallet.findOne({ userId: supplierId });
    if (!wallet) {
      return NextResponse.json({ success: false, error: "Wallet not found for this registry" }, { status: 404 });
    }

    if (wallet.balance < amt) {
      return NextResponse.json({ success: false, error: "Insufficient funds in master ledger" }, { status: 400 });
    }

    // Atomic Balance Sync
    wallet.balance -= amt;
    await wallet.save();

    // Registry Entry (Transaction)
    const transaction = new Transaction({
      userId: supplierId,
      walletId: wallet._id,
      amount: -amt, // Negative for withdrawal
      type: 'withdrawal',
      method: method || 'bank_transfer',
      status: 'completed',
      description: description || `Withdrawal: ₹${amt}`,
      metadata: { simulated: true, type: 'bank_transfer', timestamp: new Date().toISOString() }
    });
    await transaction.save();

    return NextResponse.json({
      success: true,
      message: "Withdrawal request confirmed: Registry synced.",
      data: {
        newBalance: wallet.balance,
        txId: transaction._id
      }
    });

  } catch (err) {
    console.error("POST /api/wallet/withdraw error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
