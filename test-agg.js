const mongoose = require('mongoose');
require('dotenv').config({path: '.env'});

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const userObjectId = new mongoose.Types.ObjectId('6a2920f4994b59ba962bf588');
  
  const frequentItems = await mongoose.connection.db.collection('orders').aggregate([
    { $match: { user: userObjectId, status: { $nin: ['cancelled', 'failed', 'returned'] } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', count: { $sum: 1 } } },
    { $match: { count: { $gte: 2 } } },
    { $project: { _id: 1 } }
  ]).toArray();
  
  console.log('Frequent Items:', frequentItems);
  process.exit(0);
}
test();
