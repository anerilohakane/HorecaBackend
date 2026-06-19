
const mongoose = require('mongoose');
const uri = 'mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/test?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin';
mongoose.connect(uri).then(async () => {
  const req = await mongoose.connection.db.collection('returnrequests').findOne({ rrn: 'RRN-260619-0686' });
  console.log('Return request supplier:', req.supplier);
  console.log('Order ID:', req.order);
  
  const order = await mongoose.connection.db.collection('orders').findOne({ _id: req.order });
  console.log('Order supplier:', order.supplier);
  console.log('Order items:');
  order.items.forEach(i => {
     console.log(' - product:', i.product, 'supplier:', i.supplier);
  });
  process.exit(0);
}).catch(console.error);

