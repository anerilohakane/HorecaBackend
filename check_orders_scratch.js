const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB!");

  // Let's get the last 3 orders
  const orders = await mongoose.connection.db.collection('orders')
    .find()
    .sort({ createdAt: -1 })
    .limit(3)
    .toArray();

  console.log("LAST 3 ORDERS:");
  console.log(JSON.stringify(orders, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
