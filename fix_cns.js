const mongoose = require('mongoose');
const uri = 'mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/test?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin';

mongoose.connect(uri).then(async () => {
  const ReturnRequest = require('./src/lib/db/models/returnRequest').default || require('./src/lib/db/models/returnRequest');
  const Order = require('./src/lib/db/models/order').default || require('./src/lib/db/models/order');
  const CustomerCreditNote = require('./src/lib/db/models/art/CustomerCreditNote').default || require('./src/lib/db/models/art/CustomerCreditNote');
  const User = require('./src/lib/db/models/User').default || require('./src/lib/db/models/User');
  const Employee = require('./src/lib/db/models/payroll/Employee').default || require('./src/lib/db/models/payroll/Employee');
  
  // Find all ReturnRequests in Awaiting Pickup Confirmation
  const stuckReqs = await ReturnRequest.find({ status: 'Awaiting Pickup Confirmation' });
  
  for (const returnReq of stuckReqs) {
    const existingCN = await CustomerCreditNote.findOne({ returnRequest: returnReq._id });
    if (!existingCN) {
      console.log('Generating CN for RRN:', returnReq.rrn);
      
      const originalOrder = await Order.findById(returnReq.order).lean();
      let totalRefund = 0;
      let cnItems = [];

      if (originalOrder && originalOrder.items) {
        for (const rItem of returnReq.items) {
          const finalQty = rItem.approvedQuantity || 0;
          
          if (finalQty > 0) {
            const oItem = originalOrder.items.find(i => {
              const iProductId = i.product?._id || i.product?.id || i.productId || i.product;
              const rProductId = rItem.product?._id || rItem.product?.id || rItem.product;
              return String(iProductId) === String(rProductId);
            });
            if (oItem) {
              const amount = finalQty * oItem.unitPrice;
              const gstAmount = amount * ((oItem.gst || 0) / 100);
              totalRefund += (amount + gstAmount);
              
              cnItems.push({
                description: oItem.name,
                hsnSac: oItem.sku || '',
                quantity: finalQty,
                rate: oItem.unitPrice,
                amount: amount,
                cgstPercent: (oItem.gst || 0) / 2,
                sgstPercent: (oItem.gst || 0) / 2
              });
            } else {
               console.log('Could not find order item for', rItem.product);
            }
          }
        }
      }

      if (totalRefund > 0) {
        let assignedArtMember = null;
        let artUsers = await User.find({ department: /ART/i });
        if (artUsers.length === 0) {
          const artEmployees = await Employee.find({ 'jobDetails.department': /ART/i });
          if (artEmployees.length > 0) {
            const employeeIds = artEmployees.map(e => e.employeeId);
            artUsers = await User.find({ employeeId: { $in: employeeIds } });
          }
        }
        if (artUsers.length > 0) {
          assignedArtMember = artUsers[Math.floor(Math.random() * artUsers.length)]._id;
        }

        const latestCN = await CustomerCreditNote.findOne().sort({ createdAt: -1 });
        let cnNumber = 'CCN-0001';
        if (latestCN && latestCN.cnNumber && latestCN.cnNumber.startsWith('CCN-')) {
          const parts = latestCN.cnNumber.split('-');
          const num = parseInt(parts[1], 10);
          if (!isNaN(num)) {
            cnNumber = `CCN-${String(num + 1).padStart(4, '0')}`;
          }
        }

        await CustomerCreditNote.create({
          cnNumber,
          customer: returnReq.requester,
          order: returnReq.order,
          returnRequest: returnReq._id,
          amount: totalRefund,
          reason: `Refund for Return Request ${returnReq.rrn}`,
          items: cnItems,
          assignedArtMember,
          communicationStatus: 'Pending'
        });
        console.log('Created', cnNumber);
      } else {
         console.log('Total refund was 0 for', returnReq.rrn);
      }
    }
  }
  process.exit(0);
}).catch(console.error);
