
const mongoose = require('mongoose');
const uri = 'mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/test?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin';
mongoose.connect(uri).then(async () => {
  const reqs = await mongoose.connection.db.collection('returnrequests').find({}).toArray();
  const req = reqs.find(r => r.rrn === 'RRN-260618-1B6E');
  if (!req) { console.log('Not found'); process.exit(0); }
  
  console.log('Order ID:', req.order);
  
  const order = await mongoose.connection.db.collection('orders').findOne({ _id: req.order });
  if (!order) { console.log('Order not found'); process.exit(0); }
  
  console.log('Order items count:', order.items.length);
  
  const formattedItems = order.items.map(i => ({
    product: i.product?._id || i.product?.id || i.productId || i.product,
    requestedReturnQty: i.quantity,
    orderedQuantity: i.quantity,
    deliveredQuantity: i.quantity,
    previouslyReturnedQuantity: 0,
    status: 'Pending',
    reason: req.comments || 'Not specified',
    condition: 'Unknown'
  }));
  
  await mongoose.connection.db.collection('returnrequests').updateOne(
    { _id: req._id },
    { $set: { items: formattedItems } }
  );
  console.log('Fixed items in DB for RRN-260618-1B6E');
  process.exit(0);
}).catch(console.error);

