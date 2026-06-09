const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://developer:yM7TixnN0g13SrxH@cluster0.n1b8v.mongodb.net/scm?retryWrites=true&w=majority')
  .then(async () => {
    const Product = require('./src/lib/db/models/product').default;
    const products = await Product.find({ basePrice: { $exists: true }, assuredMargin: { $exists: true } });
    
    let fixedCount = 0;
    for (const p of products) {
      const expectedPrice = p.basePrice + (p.basePrice * p.assuredMargin / 100);
      if (p.price !== expectedPrice) {
        console.log(`Fixing ${p.name}: ${p.price} -> ${expectedPrice}`);
        p.price = expectedPrice;
        await p.save();
        fixedCount++;
      }
    }
    
    console.log(`Fixed ${fixedCount} products.`);
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
