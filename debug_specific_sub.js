const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

const Schema = mongoose.Schema;
const Subscription = mongoose.model('Subscription', new Schema({ 
    productName: String,
    nextOrderDate: Date,
    status: String
}, { strict: false }));

async function checkSub() {
    try {
        await mongoose.connect(MONGODB_URI);
        const now = new Date();
        console.log(`[DEBUG] Current Check Time (UTC): ${now.toISOString()}`);
        console.log(`[DEBUG] Current Check Time (Local): ${now.toString()}`);

        // Find the Black Coffee sub
        // Using regex for flexibility in case exact name matches
        const subs = await Subscription.find({ 
            status: 'Active',
            // productName might be in 'productName' field or we might need to populate if schema changed
        });

        console.log(`[DEBUG] Found ${subs.length} active subs.`);
        
        for (const s of subs) {
            // Check product name or just print all active
            const due = new Date(s.nextOrderDate);
            console.log(`--------------------------------------------------`);
            console.log(`ID: ${s._id}`);
            console.log(`NextOrderDate (UTC):   ${due.toISOString()}`);
            console.log(`NextOrderDate (Local): ${due.toString()}`); // This will print in server's local time (IST if user machine)
            
            const diffMins = (now - due) / 60000;
            if (diffMins >= 0) {
                 console.log(`✅ STATUS: DUE! (Overdue by ${diffMins.toFixed(1)} mins)`);
            } else {
                 console.log(`❌ STATUS: NOT DUE (Future by ${Math.abs(diffMins).toFixed(1)} mins)`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkSub();
