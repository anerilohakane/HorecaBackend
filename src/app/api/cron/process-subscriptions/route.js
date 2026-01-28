
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
        // We fetch candidates, but we MUST lock them before processing to avoid race conditions.
        const dueCandidates = await Subscription.find({
            status: 'Active',
            nextOrderDate: { $lte: now },
            // Ensure we don't pick up locked items (lock timeout 5 mins)
            $or: [
                { lockedAt: null },
                { lockedAt: { $lt: new Date(now.getTime() - 5 * 60000) } }
            ]
        });

        console.log(`[CRON] Found ${dueCandidates.length} candidate subscriptions.`);

        const dueSubscriptions = [];

        // Attempt to lock each candidate
        for (const candidate of dueCandidates) {
            const lockedSub = await Subscription.findOneAndUpdate(
                {
                    _id: candidate._id,
                    // Double check condition in atomic update
                    $or: [
                        { lockedAt: null },
                        { lockedAt: { $lt: new Date(now.getTime() - 5 * 60000) } }
                    ]
                },
                { $set: { lockedAt: now } },
                { new: true }
            ).populate('product');

            if (lockedSub) {
                if (lockedSub.product) {
                    dueSubscriptions.push(lockedSub);
                } else {
                    console.warn(`[CRON] Subscription ${lockedSub._id} locked but product missing.`);
                    // Release lock or duplicate behavior? Just fail it later.
                    // Ideally unlock, but we let it fail in processing.
                    dueSubscriptions.push(lockedSub); 
                }
            } else {
                 console.log(`[CRON] Race condition: Subscription ${candidate._id} was locked by another process.`);
            }
        }

        console.log(`[CRON] Successfully locked and processing ${dueSubscriptions.length} subscriptions.`);

        const results = {
            processed: 0,
            ordersCreated: 0,
            failed: 0,
            errors: []
        };
        
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

                // Build Items Array & Total
                const items = [];
                let orderTotal = 0;
                let subtotal = 0;

                for (const sub of subs) {
                    // --- TC-OM-014: Out of Stock Handling ---
                    // Check stock. If insufficient, skip adding to items.
                    if (sub.product.stockQuantity < sub.quantity) {
                         console.warn(`[CRON] Subscription ${sub._id} SKIPPED due to Out of Stock. (Stock: ${sub.product.stockQuantity}, Req: ${sub.quantity})`);
                         continue;
                    }

                    // --- TC-OM-017: Max Quantity Limit ---
                    const MAX_QTY = 100;
                    if (sub.quantity > MAX_QTY) {
                        console.warn(`[CRON] Subscription ${sub._id} has excessive quantity (${sub.quantity}). Capped at ${MAX_QTY} or skipped? Skipping.`);
                        continue;
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
                }

                if (items.length === 0) {
                    console.log(`[CRON] Group ${key} has no valid items (OOS or other issue). Skipping order creation.`);
                    continue; 
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

                // --- STOCK UPDATE LOGIC ---
                console.log(`[CRON] Decrementing stock for Order ${newOrder.orderNumber}`);
                for (const item of items) {
                    try {
                        await Product.updateOne(
                            { _id: item.product },
                            { $inc: { stockQuantity: -item.quantity } }
                        );
                        console.log(`[CRON] Decremented stock for product ${item.product} by ${item.quantity}`);
                    } catch (stockErr) {
                        console.error(`[CRON] Failed to decrement stock for product ${item.product}:`, stockErr);
                        // Continue even if one fails, but log it critical
                    }
                }

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
                    sub.lockedAt = null; // Release lock
                    await sub.save();
                    results.processed++;
                }

            } catch (err) {
                 console.error(`[CRON] Error processing group ${key}:`, err);
                 results.failed += subs.length;
                 results.errors.push(err.message);
                 
                 // Release locks for failed group so they can be retried (or handled manually)
                 // Or keep locked to prevent infinite loop?
                 // Let's release so they retry, but maybe with backoff?
                 // For now, release.
                 for (const sub of subs) {
                     await Subscription.updateOne({ _id: sub._id }, { $set: { lockedAt: null } });
                 }
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error('CRON API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
