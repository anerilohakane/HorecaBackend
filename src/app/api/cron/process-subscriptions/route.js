
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscription from '@/lib/db/models/subscription';
import Order from '@/lib/db/models/order';
import Product from '@/lib/db/models/product';
import Customer from '@/lib/db/models/customer';
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
            errors: [],
            logs: []
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
            // Handle both populated and unpopulated user field
            const key = `${sub.user._id || sub.user}_${sub.frequency}_${sub.preferredDay || 'x'}_${sub.preferredTime || 'x'}`;
            
            if (!groups[key]) {
                groups[key] = {
                    user: sub.user,
                    subs: []
                };
            }
            groups[key].subs.push(sub);
        }

        results.logs.push(`Found ${dueSubscriptions.length} due subs. Groups: ${Object.keys(groups)}.`);

        // 3. Process Groups
        for (const key in groups) {
            const group = groups[key];
            // Safe access to ID
            const userId = group.user._id || group.user;
            const subs = group.subs;

            try {
                // Fetch Last Address
                let shippingAddress = null;
                const lastOrder = await Order.findOne({ user: userId })
                    .sort({ createdAt: -1 })
                    .select('shippingAddress payment');

                console.log(`[CRON] Validating Last Order for User ${userId}. Found:`, lastOrder ? "Yes" : "No");

                if (lastOrder && lastOrder.shippingAddress && lastOrder.shippingAddress.addressLine1 && lastOrder.shippingAddress.pincode) {
                     console.log(`[CRON] Using LastOrder address.`);
                     shippingAddress = lastOrder.shippingAddress;
                } else {
                    // Fallback to Customer Profile
                    console.log(`[CRON] Checking Customer Profile fallback...`);
                    const customer = await Customer.findById(userId);
                    
                    if (customer && customer.address && customer.pincode) {
                         console.log(`[CRON] Using Customer Profile address.`);
                         shippingAddress = {
                             fullName: customer.name || "Valued Customer",
                             addressLine1: customer.address,
                             addressLine2: "", // Customer model is simple string
                             city: customer.city || "",
                             state: customer.state || "",
                             pincode: customer.pincode,
                             phone: customer.phone || ""
                         };
                    }
                }

                // Enhanced check: Ensure all required fields exist.
                if (!shippingAddress || !shippingAddress.addressLine1 || !shippingAddress.pincode) {
                    const msg = `User ${userId} has NO valid address (Order or Profile). Skipping.`;
                    console.error(msg);
                    results.logs.push(msg); // Keep critical errors in logs
                    results.failed += subs.length;
                    continue; // Skip this group, requires user intervention
                }
                
                // Build Items Array & Total
                const items = [];
                let orderTotal = 0;
                let subtotal = 0;

                for (const sub of subs) {
                    // --- TC-OM-014: Out of Stock Handling ---
                    // Check stock. If insufficient, PAUSE subscription.
                    if (sub.product.stockQuantity < sub.quantity) {
                         const msg = `[CRON] Subscription ${sub._id} PAUSED due to Out of Stock. (Stock: ${sub.product.stockQuantity}, Req: ${sub.quantity})`;
                         console.warn(msg);
                         results.logs.push(msg);
                         
                         // Update Status to Paused
                         sub.status = 'Paused';
                         await sub.save(); // Save immediately so it doesn't get picked up again
                         
                         // Notify User
                         try {
                             await Notification.create({
                                 user: sub.user, // sub.user is ObjectId since not populated
                                 title: "Subscription Paused: Out of Stock",
                                 message: `Your subscription for "${sub.product.name}" was paused because it is out of stock. We will auto-resume it when stock returns.`,
                                 type: "warning",
                                 metadata: {
                                    subscriptionId: sub._id,
                                    productId: sub.product._id
                                 }
                             });
                             console.log(`[CRON] Notification created for User ${sub.user}`);
                         } catch (notifErr) {
                             console.error(`[CRON] Failed to create notification:`, notifErr);
                         }

                         continue;
                    }

                    // --- TC-OM-NEW: Symmetric Price Protection ---
                    // If price CHANGED by >= 1 unit (up or down), Pause & Notify.
                    const currentPrice = sub.product.price || 0;
                    const lockedPrice = sub.lockedPrice || currentPrice;
                    
                    if (Math.abs(currentPrice - lockedPrice) >= 1) {
                        const changeType = currentPrice > lockedPrice ? "increased" : "decreased";
                        const msg = `[CRON] Subscription ${sub._id} PAUSED due to Price Change (${changeType}). (Locked: ${lockedPrice}, Current: ${currentPrice})`;
                        console.warn(msg);
                        results.logs.push(msg);

                        sub.status = 'Paused';
                        await sub.save();

                        // Notify User
                        try {
                             await Notification.create({
                                 user: sub.user,
                                 title: `Subscription Paused: Price ${changeType}`,
                                 message: `The price for "${sub.product.name}" ${changeType} to ₹${currentPrice} (was ₹${lockedPrice}). Please approve the new price to resume.`,
                                 type: "warning",
                                 metadata: {
                                    subscriptionId: sub._id,
                                    productId: sub.product._id,
                                    oldPrice: lockedPrice,
                                    newPrice: currentPrice
                                 }
                             });
                        } catch (notifErr) { console.error(notifErr); }

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
                
                results.logs.push(`Generated ${items.length} items from subs.`);

                if (items.length === 0) {
                    console.log(`[CRON] Group ${key} has no valid items. Skipping.`);
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
                    shippingAddress: shippingAddress,
                    subtotal: subtotal,
                    total: orderTotal,
                    status: 'pending',
                 
                    payment: { method: (lastOrder && lastOrder.payment && lastOrder.payment.method) || 'cash_on_delivery', status: 'pending' },
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
                    // Skip updates for Paused/Cancelled items (e.g. OOS ones)
                    if (sub.status !== 'Active') continue;

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
