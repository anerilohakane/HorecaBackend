import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscription from '@/lib/db/models/subscription';
import Order from '@/lib/db/models/order';
import Product from '@/lib/db/models/product';
import User from '@/lib/db/models/User';
import mongoose from 'mongoose';

// Simple API Key security (Optional, but recommended)
// Pass ?key=YOUR_SECRET_KEY in the URL
const CRON_SECRET = process.env.CRON_SECRET || 'dev_cron_secret';

export async function GET(req) {
    try {
        await dbConnect();
        
        // 1. Security Check
        const { searchParams } = new URL(req.url);
        // if (searchParams.get('key') !== CRON_SECRET) {
        //     return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        // }

        const now = new Date();
        // today.setHours(23, 59, 59, 999); // REMOVED: Precision required

        // 2. Find Due Subscriptions
        // nextOrderDate is less than or equal to NOW AND status is Active
        const dueSubscriptions = await Subscription.find({
            nextOrderDate: { $lte: now },
            status: 'Active'
        }).populate('product');

        if (dueSubscriptions.length === 0) {
            return NextResponse.json({ success: true, message: 'No subscriptions due today', processed: 0 });
        }

        const stats = {
            total: dueSubscriptions.length,
            created: 0,
            failed: 0,
            errors: []
        };

        // 3. Process Each Subscription
        for (const sub of dueSubscriptions) {
            try {
                if (!sub.product) {
                    throw new Error(`Product not found for subscription ${sub._id}`);
                }

                // A. Get User's Default/Last Address from their last Order
                // (Since we don't store address in Subscription, we assume repeat purchase uses last address)
                const lastOrder = await Order.findOne({ user: sub.user })
                                            .sort({ createdAt: -1 })
                                            .select('shippingAddress b2b');

                if (!lastOrder) {
                    throw new Error(`No previous order found for user ${sub.user} to fetch address`);
                }

                // B. Order Number Generator
                const uniqueSuffix = Date.now() + '-' + Math.floor(Math.random() * 1000);
                const orderNumber = `ORD-SUB-${uniqueSuffix}`;

                // C. Calculate Totals
                const unitPrice = sub.product.price;
                const quantity = sub.quantity;
                const total = unitPrice * quantity;

                // D. Create Order
                const newOrder = await Order.create({
                    orderNumber,
                    orderId: `ORD-SUB-ID-${uniqueSuffix}`, // Required for legacy DB index
                    user: sub.user,
                    items: [{
                        product: sub.product._id,
                        name: sub.product.name || sub.productName,
                        quantity: quantity,
                        unitPrice: unitPrice,
                        totalPrice: total,
                        image: sub.product.image || sub.productImage
                    }],
                    shippingAddress: lastOrder.shippingAddress,
                    b2b: lastOrder.b2b, // Carry over B2B details if any
                    subtotal: total,
                    total: total,
                    status: 'pending',
                    payment: {
                        method: 'cod', // Default to COD for auto-orders
                        status: 'pending'
                    },
                    metadata: {
                        subscriptionId: sub._id,
                        isAutoOrder: true
                    }
                });

                // E. Update Next Order Date
                const nextDate = new Date(sub.nextOrderDate);
                if (sub.frequency === 'Weekly') {
                    nextDate.setDate(nextDate.getDate() + 7);
                } else if (sub.frequency === 'Monthly') {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }
                
                sub.nextOrderDate = nextDate;
                sub.lastOrderDate = new Date();
                await sub.save();

                stats.created++;

            } catch (err) {
                console.error(`Failed to process subscription ${sub._id}:`, err);
                stats.failed++;
                stats.errors.push({ id: sub._id, error: err.message });
            }
        }

        return NextResponse.json({ success: true, stats }, { status: 200 });

    } catch (error) {
        console.error('Cron Job Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
