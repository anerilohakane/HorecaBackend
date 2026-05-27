require('dotenv').config();
const mongoose = require('mongoose');
const { default: dbConnect } = require('../src/lib/db/connect');
const { default: Order } = require('../src/lib/db/models/order');
// Force registration of all models that might be used for population
require('../src/lib/db/models/product');
require('../src/lib/db/models/supplier');
require('../src/lib/db/models/User');
require('../src/lib/db/models/customer');
require('../src/lib/db/models/Department');

async function test() {
  await dbConnect();
  try {
    const orders = await Order.find().limit(5).lean();
    console.log("Fetched orders count:", orders.length);
    console.log("Success");
  } catch (err) {
    console.error("Fetch failed:", err);
  }
  process.exit();
}

test();
