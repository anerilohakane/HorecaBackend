const mongoose = require('mongoose');
const uri = 'mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/test?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin';

const ReturnRequestSchema = new mongoose.Schema({
  rrn: String,
  status: String
}, { strict: false });

const ReturnRequest = mongoose.models.ReturnRequest || mongoose.model("ReturnRequest", ReturnRequestSchema);

mongoose.connect(uri).then(async () => {
  const returns = await ReturnRequest.find({}).select('rrn status updatedAt');
  console.log('--- RETURN REQUESTS ---');
  console.log(returns);
  process.exit(0);
}).catch(console.error);
