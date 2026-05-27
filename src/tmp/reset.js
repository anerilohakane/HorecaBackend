import mongoose from "mongoose";
import dbConnect from "../lib/db/connect";
import Transaction from "../lib/db/models/transaction";
import Wallet from "../lib/db/models/wallet";

export default async function resetWallet(userId) {
  await dbConnect();
  const id = new mongoose.Types.ObjectId(userId);
  
  // 1. Delete all transactions for this user
  const txResult = await Transaction.deleteMany({ userId: id });
  console.log(`Deleted ${txResult.deletedCount} transactions.`);

  // 2. Reset the wallet balance field to 0
  await Wallet.updateOne({ userId: id }, { 
    $set: { 
      balance: 0, 
      realizedSavings: 0, 
      escrowedPoints: 0, 
      totalEarnings: 0 
    } 
  });
  
  return { success: true, message: "Wallet wiped clean" };
}
