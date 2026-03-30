const mongoose = require('mongoose');

// MONGODB_URI=mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0
const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

async function settle() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");

    // Load models (simplified)
    const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({
        supplier: mongoose.Types.ObjectId,
        total: Number,
        status: String,
        orderNumber: String
    }, { strict: false }));

    const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', new mongoose.Schema({
        userId: mongoose.Types.ObjectId,
        balance: { type: Number, default: 0 }
    }, { strict: false }));

    const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({
        userId: mongoose.Types.ObjectId,
        amount: Number,
        type: String,
        status: String
    }, { strict: false }));

    // Find all delivered orders
    const deliveredOrders = await Order.find({ status: 'delivered' });
    console.log(`Found ${deliveredOrders.length} delivered orders`);

    for (const order of deliveredOrders) {
      if (!order.supplier) continue;

      // Check if already settled in transactions
      const existingTx = await Transaction.findOne({ 
          type: 'deposit', 
          'metadata.orderId': order._id 
      });

      if (!existingTx) {
        console.log(`Settling Order ${order.orderNumber} (₹${order.total})...`);
        
        let wallet = await Wallet.findOne({ userId: order.supplier });
        if (!wallet) {
          wallet = new Wallet({ userId: order.supplier, balance: 0 });
        }

        wallet.balance += (order.total || 0);
        await wallet.save();

        const tx = new Transaction({
          userId: order.supplier,
          walletId: wallet._id,
          amount: order.total,
          type: 'deposit',
          method: 'order_settlement_initial',
          status: 'completed',
          description: `Initial Sync Settlement for Order: ${order.orderNumber}`,
          metadata: { orderId: order._id, orderNumber: order.orderNumber }
        });
        await tx.save();
        console.log("Success.");
      } else {
        console.log(`Order ${order.orderNumber} already settled.`);
      }
    }

    console.log("Settlement sync complete.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

settle();
