
const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

const connect = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected! DB Name:', mongoose.connection.db.databaseName);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name).join(', '));
    
    const customers = await mongoose.connection.db.collection('customers').find().limit(5).toArray();
    console.log('Sample Customer IDs:', customers.map(c => c._id).join(', '));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Connection failed:', err);
  }
};

connect();
