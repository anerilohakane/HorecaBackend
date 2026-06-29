const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb+srv://pranallai:Xo7ZzD6O3160p2G6@cluster0.z2214.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
  
  const PO = mongoose.connection.db.collection('purchaseorders');
  const pos = await PO.find({}).limit(5).toArray();
  console.log("Sample POs:", JSON.stringify(pos, null, 2));

  const Customer = mongoose.connection.db.collection('customers');
  const poMandatoryCustomers = await Customer.find({ poMandatory: true }).limit(5).toArray();
  console.log("Sample PO Mandatory Customers:", JSON.stringify(poMandatoryCustomers, null, 2));

  process.exit(0);
}

check().catch(console.error);
