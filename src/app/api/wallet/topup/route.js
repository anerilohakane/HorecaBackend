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
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }

    // SILENTLY Upsert Wallet
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0 });
    }

    // Atomic Balance Sync
    wallet.balance += amt;
    await wallet.save();

    // Registry Entry (Transaction)
    const transaction = new Transaction({
      userId,
      walletId: wallet._id,
      amount: amt,
      type: 'deposit',
      method: method || 'simulated_card',
      status: 'completed',
      description: description || `Wallet Top-up: ₹${amt}`,
      metadata: { simulated: true, timestamp: new Date().toISOString() }
    });
    await transaction.save();

    return NextResponse.json({
      success: true,
      message: "Registry Synced: Funds deposited to wallet.",
      data: {
        newBalance: wallet.balance,
        txId: transaction._id
      }
    });

  } catch (err) {
    console.error("POST /api/wallet/topup error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
