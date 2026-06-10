const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/work/Horeca/HorecaBackend/.env' });
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const orders = db.collection('orders');
  const pos = db.collection('purchaseorders');
  const cursor = orders.find({ orderSource: 'Vendor' });
  const docs = await cursor.toArray();
  for (const o of docs) {
    const po = await pos.findOne({ poNumber: o.orderNumber });
    if (po) {
      const newItems = o.items.map((it, i) => {
        const poIt = po.items[i];
        if (poIt) {
          if (mongoose.Types.ObjectId.isValid(poIt.productId)) {
             it.product = new mongoose.Types.ObjectId(poIt.productId);
          }
          it.name = poIt.productName;
          it.quantity = parseFloat(poIt.orderedQty) || parseFloat(it.quantity) || 1;
        }
        return it;
      });
      await orders.updateOne({ _id: o._id }, { $set: { items: newItems } });
      console.log('Fixed', o.orderNumber);
    }
  }
  process.exit(0);
}).catch(console.error);
