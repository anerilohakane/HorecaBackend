
const mongoose = require('mongoose');
const uri = 'mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/test?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin';
mongoose.connect(uri).then(async () => {
  const Order = require('./src/lib/db/models/order').default || require('./src/lib/db/models/order');
  const order = await Order.findById('6a326b0527574c2032fbbcbe');
  console.log('Mongoose order items count:', order?.items?.length);
  if (order?.items?.length > 0) {
      console.log('First item product:', order.items[0].product);
  }
  process.exit(0);
}).catch(console.error);

