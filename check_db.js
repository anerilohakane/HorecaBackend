
const mongoose = require('mongoose');
const uri = 'mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/test?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin';
mongoose.connect(uri).then(async () => {
  const cns = await mongoose.connection.db.collection('customercreditnotes').find({}).sort({createdAt: -1}).limit(5).toArray();
  cns.forEach(cn => {
     console.log('CN Number:', cn.cnNumber, 'Date:', cn.createdAt, 'Amount:', cn.amount);
  });
  
  const returnReqs = await mongoose.connection.db.collection('returnrequests').find({ status: 'Awaiting Pickup Confirmation' }).sort({createdAt: -1}).limit(2).toArray();
  console.log('Latest Awaiting Pickup Confirmation Return Reqs:');
  returnReqs.forEach(req => {
     console.log('RRN:', req.rrn, 'Date:', req.updatedAt || req.createdAt);
  });
  process.exit(0);
}).catch(console.error);

