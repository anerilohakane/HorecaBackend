
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscription from '@/lib/db/models/subscription';
import Order from '@/lib/db/models/order';
import Product from '@/lib/db/models/product';

// Mark as dynamic to avoid static generation
export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        await dbConnect();
        
        const now = new Date();
        console.log(`[CRON] Starting subscription processing at ${now.toISOString()}`);

        // 1. Find due subscriptions
        const dueSubscriptions = await Subscription.find({
            status: 'Active',
            nextOrderDate: { $lte: now }
        }).populate('product');

        console.log(`[CRON] Found ${dueSubscriptions.length} due subscriptions.`);

        const results = {
            processed: 0,
            ordersCreated: 0,
            failed: 0,
            errors: []
        };

        if (dueSubscriptions.length === 0) {
            return NextResponse.json({ success: true, results });
        }

        // 2. Group by User + Frequency + PreferredTime (Approx)
        // We want to bundle items that are due together for the same user.
        // Key: "userId_frequency_preferredDay_preferredTime"
        const groups = {};

        for (const sub of dueSubscriptions) {
            if (!sub.product) {
                 results.failed++;
                 continue;
            }

            // Create a grouping key
            // Note: If frequency/time differs significantly, they should be separate orders.
            const key = `${sub.user._id}_${sub.frequency}_${sub.preferredDay || 'x'}_${sub.preferredTime || 'x'}`;
            
            if (!groups[key]) {
                groups[key] = {
                    user: sub.user,
                    subs: []
                };
            }
            groups[key].subs.push(sub);
        }

        console.log(`[CRON] Consolidated into ${Object.keys(groups).length} order groups.`);

        // 3. Process Groups
        for (const key in groups) {
            const group = groups[key];
            const userId = group.user._id;
            const subs = group.subs;

            try {
                // Fetch Last Address
                const lastOrder = await Order.findOne({ user: userId })
                    .sort({ createdAt: -1 })
                    .select('shippingAddress');

                if (!lastOrder || !lastOrder.shippingAddress) {
                    console.error(`[CRON] User ${userId} has no previous orders/address. Skipping group.`);
                    results.failed += subs.length;
                    continue;
                }

                // Build Items Array & Total
                const items = [];
                let orderTotal = 0;
                let subtotal = 0;

                for (const sub of subs) {
                    const price = sub.product.price || 0;
                    const total = price * sub.quantity;
                    
                    items.push({
                        product: sub.product._id,
                        name: sub.product.name,
                        quantity: sub.quantity,
                        unitPrice: price,
                        totalPrice: total,
                        image: sub.product.images?.[0]?.url || sub.product.image
                    });

                    subtotal += total;
                }
                
                // Add shipping/tax logic here if needed (skipping for simplicity)
                orderTotal = subtotal;

                // Create Consolidated Order
                const uniqueSuffix = Date.now().toString(36).toUpperCase();
                const random = Math.floor(Math.random() * 1000);
                const orderNumber = `ORD-AUTO-${uniqueSuffix}-${random}`;

                const newOrder = await Order.create({
                    orderNumber,
                    user: userId,
                    items: items,
                    shippingAddress: lastOrder.shippingAddress,
                    subtotal: subtotal,
                    total: orderTotal,
                    status: 'pending',
                    payment: { method: 'cash_on_delivery', status: 'pending' },
                    metadata: { 
                        isAutoOrder: true, 
                        subscriptionIds: subs.map(s => s._id), // Store array of sub IDs
                        triggeredAt: now
                    }
                });

                console.log(`[CRON] Order ${newOrder.orderNumber} created for User ${userId}`);
                results.ordersCreated++;

                // 4. Update ALL Subscriptions in this group
                for (const sub of subs) {
                    const currentNextDate = new Date(sub.nextOrderDate);
                    let nextDate = new Date(currentNextDate);

                    // --- RECURRENCE LOGIC ---
                    // --- RECURRENCE LOGIC ---
                    if (sub.frequency === 'Once') {
                        // One-time order completed.
                        sub.status = 'Completed';
                        // Keep nextOrderDate as is (history) or clear it? Keeping it as record.
                    } else {
                        // RECURRING (Weekly/Monthly/Daily)
                        if (sub.frequency === 'Daily') {
                            nextDate.setDate(nextDate.getDate() + 1);
                        } else if (sub.frequency === 'Weekly') {
                            nextDate.setDate(nextDate.getDate() + 7);
                        } else if (sub.frequency === 'Monthly') {
                             // Logic to advance month while PRESERVING TIME (Avoid Timezone Shift)
                             // 1. Determine target month/year
                             let targetMonth = nextDate.getMonth() + 1; 
                             
                             // Create a temp date to inspect the Target Month
                             const tempDate = new Date(nextDate);
                             tempDate.setDate(1); // Reset to 1st
                             tempDate.setMonth(tempDate.getMonth() + 1); // Advance 1 month
                             
                             const daysInTargetMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate();
                             
                             // 2. Determine target day (Preferred vs Max)
                             const preferredDay = sub.preferredDay || nextDate.getDate(); // fallback to current day
                             const dayToSet = Math.min(preferredDay, daysInTargetMonth);
                             
                             // 3. Apply changes to nextDate
                             nextDate.setDate(1); 
                             nextDate.setMonth(nextDate.getMonth() + 1);
                             nextDate.setDate(dayToSet);
                        }

                        // Check End Date
                        if (sub.endDate && nextDate > new Date(sub.endDate)) {
                            console.log(`[CRON] Subscription ${sub._id} reached end date. marking Completed.`);
                            sub.status = 'Completed';
                        }
                        
                        sub.nextOrderDate = nextDate;
                    }

                    sub.nextOrderDate = nextDate;
                    sub.lastOrderDate = now;
                    await sub.save();
                    results.processed++;
                }

            } catch (err) {
                 console.error(`[CRON] Error processing group ${key}:`, err);
                 results.failed += subs.length;
                 results.errors.push(err.message);
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error('CRON API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
