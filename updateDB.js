const mongoose = require('mongoose');
mongoose.connect("mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin")
  .then(() => mongoose.connection.db.collection('purchaseorders').updateMany({ status: 'Partial Received' }, { $set: { status: 'Partially Received' } }))
  .then(res => { console.log('Updated:', res.modifiedCount); process.exit(0); })
  .catch(console.error);
