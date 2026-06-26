const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI missing");
  process.exit(1);
}

const { Schema } = mongoose;

const ReturnItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    requestedReturnQty: Number,
    reason: String,
    images: [String],
    expiryDate: Date,
    deliveryDate: Date,
    batchDetails: String,
  },
  { _id: false, strict: false }
);

const ReturnRequestSchema = new Schema(
  {
    rrn: String,
    items: [ReturnItemSchema],
  },
  { strict: false }
);

const ReturnRequest = mongoose.models.ReturnRequest || mongoose.model("ReturnRequest", ReturnRequestSchema);

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to Mongo");

    const rrns = ['RRN-260626-0F79', 'RRN-260626-AE22'];
    for (const rrn of rrns) {
      const doc = await ReturnRequest.findOne({ rrn }).lean();
      console.log(`\n================ ${rrn} ================`);
      if (!doc) {
        console.log("Not found in DB");
      } else {
        console.log("Status:", doc.status);
        console.log("Items:");
        doc.items.forEach((item, idx) => {
          console.log(`  Item ${idx + 1}:`);
          console.log(`    Product:`, item.product);
          console.log(`    Reason:`, item.reason);
          console.log(`    Images:`, item.images);
          console.log(`    ExpiryDate:`, item.expiryDate);
          console.log(`    DeliveryDate:`, item.deliveryDate);
          console.log(`    BatchDetails:`, item.batchDetails);
        });
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Query failed:", err);
  }
}

run();
