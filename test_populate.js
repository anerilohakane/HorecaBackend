const mongoose = require('mongoose');
const uri = 'mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/test?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin';

const ReturnItemSchema = new mongoose.Schema({}, { _id: false, strict: false });
const ReturnRequestSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  status: String,
  rrn: String
}, { strict: false });

const ReturnRequest = mongoose.models.ReturnRequest || mongoose.model("ReturnRequest", ReturnRequestSchema);

mongoose.connect(uri).then(async () => {
  const req = await ReturnRequest.findOne({ rrn: 'RRN-260622-52DC' })
    .populate("order")
    .populate("requester");
  
  console.log('--- RETURN REQUEST ---');
  console.log('RRN:', req?.rrn);
  console.log('Status:', req?.status);
  console.log('Order populated:', req?.order ? 'YES' : 'NO');
  if (req?.order) {
    console.log('Order _id:', req.order._id);
    console.log('Order orderNumber:', req.order.orderNumber);
    console.log('Order shippingAddress:', req.order.shippingAddress);
  }
  console.log('Requester populated:', req?.requester ? 'YES' : 'NO');
  if (req?.requester) {
    console.log('Customer name:', req.requester.name);
    console.log('Customer address:', req.requester.address);
    console.log('Customer locations:', req.requester.locations);
  }
  process.exit(0);
}).catch(console.error);
