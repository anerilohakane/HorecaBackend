require('dotenv').config({ path: 'c:/Users/bhosa/Desktop/Work/Unifood_SCM/HorecaBackend/.env' });
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/unifood').then(async () => {
  const Product = require('./HorecaBackend/src/lib/db/models/product.js').default;
  console.log(Product.schema.paths.isColdStorage ? "Schema has isColdStorage" : "Schema MISSING isColdStorage");
  const prod = await Product.findOneAndUpdate(
    { sku: 'HGHGHJH76765BNV' },
    { $set: { isColdStorage: 'Yes', temperature: '8', name: 'Milk test' } },
    { new: true, runValidators: true }
  );
  console.log('Result:', JSON.stringify(prod, null, 2));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
