
const mongoose = require('mongoose');
const uri = 'mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/test?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin';
mongoose.connect(uri).then(async () => {
  const reqs = await mongoose.connection.db.collection('returnrequests').find({}).sort({createdAt: -1}).limit(3).toArray();
  reqs.forEach(req => {
     console.log('RRN:', req.rrn, 'Items count:', req.items?.length, 'Date:', req.createdAt);
     if (req.items?.length === 0) {
         console.log('Order:', req.order);
     }
  });
  process.exit(0);
}).catch(console.error);

