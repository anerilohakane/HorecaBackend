
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscription from '@/lib/db/models/subscription';
import Order from '@/lib/db/models/order';
import Product from '@/lib/db/models/product';
import Notification from '@/lib/db/models/notification';

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

                // --- TC-OM-016: Address Deletion/Validation ---
                // We rely on the snapshot in lastOrder. 
                // Debug Log
                console.log(`[CRON] Validating Last Order for User ${userId}. Found:`, lastOrder ? "Yes" : "No");
                if (lastOrder && lastOrder.shippingAddress) {
                    console.log(`[CRON] Address Check: Line1=${lastOrder.shippingAddress.addressLine1}, Pin=${lastOrder.shippingAddress.pincode}`);
                }

                // Enhanced check: Ensure all required fields exist.
                if (!lastOrder || !lastOrder.shippingAddress || !lastOrder.shippingAddress.addressLine1 || !lastOrder.shippingAddress.pincode) {
                    console.error(`[CRON] User ${userId} has INVALID previous address. Skipping group. LastOrder ID: ${lastOrder?._id}`);
                    results.failed += subs.length;
                    continue; // Skip this group, requires user intervention
                }

                // --- STRICT VALIDATION PHASE ---
                // Check ALL items for availability first. If ANY is OOS, fail the whole group.
                const failedItems = [];
                for (const sub of subs) {
                    if (sub.product.stockQuantity < sub.quantity) {
                        failedItems.push(`${sub.product.name} (Stock: ${sub.product.stockQuantity})`);
                    }
                }

                if (failedItems.length > 0) {
                    const reason = `Order blocked. Out of Stock: ${failedItems.join(', ')}`;
                    console.warn(`[CRON] Blocking Group ${key}. ${reason}`);
                    
                    // 1. Notify User
                    await Notification.create({
                        user: userId,
                        title: 'Scheduled Order Failed',
                        message: `Your scheduled order could not be placed because the following items are out of stock: ${failedItems.join(', ')}. Please update your subscription or try again later.`,
                        type: 'subscription_alert'
                    });

                    // 2. Mark Subscriptions as Failed (but keep Active)
                    for (const sub of subs) {
                         sub.lastRunStatus = 'Failed';
                         sub.failureReason = reason;
                         // We probably should NOT advance the date? Or should we?
                         // If we don't advance, it will retry immediately on next run (e.g. 1 min later).
                         // If stock is still 0, it will spam notifications.
                         // BETTER: Advance the date to 'tomorrow' or 'next Retry'?
                         // User requirement: "Block the order". 
                         // To prevent spam, we will NOT advance the date implies it stays 'Due'.
                         // But to prevent loop spam in a real cron (every minute), we ideally should have a 'retryAfter' or just rely on 'lastRunStatus'.
                         // For now, to be safe and avoid infinite loops if the cron runs typically daily, we leave date alone?
                         // NO, if I leave date alone, it's still <= Now. It will run again in 1 min.
                         // Solution: Advance date by 1 day (Retry tomorrow).
                         // OR: Just mark failure and let user fix?
                         // Let's Advance Date by 1 Day as a "Retry Delay".
                         
                         // Logic: simple +1 day for retry
                         const currentNext = new Date(sub.nextOrderDate);
                         const retryDate = new Date(currentNext);
                         retryDate.setDate(retryDate.getDate() + 1);
                         sub.nextOrderDate = retryDate;
                         
                         await sub.save();
                    }
                    
                    results.failed += subs.length;
                    continue; // BLOCK THE ORDER
                }

                // --- BUILD ITEMS PHASE (All Valid) ---
                const items = [];
                let orderTotal = 0;
                let subtotal = 0;

                for (const sub of subs) {
                    // --- TC-OM-017: Max Quantity Limit ---
                    const MAX_QTY = 100;
                    if (sub.quantity > MAX_QTY) {
                         console.warn(`[CRON] Subscription ${sub._id} capped at ${MAX_QTY} (Req: ${sub.quantity})`);
                         sub.quantity = MAX_QTY;
                    }

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
                    
                    // Clear failure status on success
                    sub.lastRunStatus = 'Success';
                    sub.failureReason = null;
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
                    // --- TC-OM-019: Payment Method Persistence ---
                    payment: { method: lastOrder.payment?.method || 'cash_on_delivery', status: 'pending' },
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
                             // TC-OM-018: Robust End-of-Month Logic
                             // Logic: Advance Month. Then clamp day to valid range.
                             // Example: Jan 31 -> Feb 1 (if simple add) -> Feb 28 (if clamped)

                             // 1. Get current month details
                             const nextDateCurrent = new Date(nextDate); // clone
                             const currentMonth = nextDateCurrent.getMonth();
                             const targetMonth = currentMonth + 1; 
                             
                             // 2. Determine target day
                             const targetDay = sub.preferredDay || nextDate.getDate();
                             
                             // 3. Set to 1st of target month first
                             nextDate.setDate(1); 
                             nextDate.setMonth(targetMonth);

                             // 4. Find max days in this new target month
                             const daysInTargetMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
                             
                             // 5. Clamp target day
                             const dayToSet = Math.min(targetDay, daysInTargetMonth);
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
