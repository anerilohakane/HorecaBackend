
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscription from '@/lib/db/models/subscription';
import Product from '@/lib/db/models/product';
import User from '@/lib/db/models/User';

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { userId, productId, quantity, frequency, preferredDay, preferredTime } = body;

        // Basic validation
        if (!userId || !productId || !frequency) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Verify product
        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
        }

        // --- Calculate Initial Start Date / Next Order Date ---
        const now = new Date();
        let nextDate = new Date();

        // Parse Time (HH:MM)
        let hours = 9; // Default 9 AM
        let minutes = 0;
        if (preferredTime) {
            const [h, m] = preferredTime.split(':').map(Number);
            if (!isNaN(h)) hours = h;
            if (!isNaN(m)) minutes = m;
        }
        nextDate.setHours(hours, minutes, 0, 0);

        // Calculate Initial Next Order Date
        if (body.startDate) {
            // User provided specific start date
            nextDate = new Date(body.startDate);
            // Apply preferred Time
            let hours = 9;
            let minutes = 0;
            if (preferredTime) {
                const [h, m] = preferredTime.split(':').map(Number);
                if (!isNaN(h)) hours = h;
                if (!isNaN(m)) minutes = m;
            }
            nextDate.setHours(hours, minutes, 0, 0);

            // If selected time has passed today, logic is tricky:
            // "Auto Reorder" implies executes "From now on". 
            // If user selects "Today" and time is *past*, user probably expects it to run *now* or *next occurence*?
            // Usually "Start Date" implies the first anchor.
            // If the user wants it to run *now*, and they pick Today + Past Time, the Cron (<= now) will pick it up immediately.
            // This is arguably correct behavior for "Force run today".
            
        } else {
             // Fallback to legacy logic (calculating from 'preferredDay' number)
            if (frequency === 'Monthly') {
                // Use preferredDay (1-31)
                const pDay = preferredDay || now.getDate();
                nextDate.setDate(pDay);

                // If the calculated date is in the past (e.g., today is 20th, preferred is 10th), move to next month
                if (nextDate <= now) {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }
            } else if (frequency === 'Weekly') {
                 // If preferredDay (0-6)
                 if (preferredDay !== undefined) {
                     const currentDay = now.getDay();
                     const daysUntil = (preferredDay + 7 - currentDay) % 7;
                     let addDays = daysUntil;
                     // If today is the day but time passed, move to next week
                     if (daysUntil === 0 && nextDate <= now) {
                         addDays = 7;
                     }
                     nextDate.setDate(now.getDate() + addDays);
                 } else {
                     nextDate.setDate(now.getDate() + 7);
                 }
            }
        }

        const newSubscription = await Subscription.create({
            user: userId,
            product: productId,
            quantity: quantity || 1,
            frequency,
            status: 'Active',
            startDate: now, // When the subscription was created
            nextOrderDate: nextDate, // The first scheduled order
            preferredDay,
            preferredTime,
            productName: product.name,
            productImage: product.image || (product.images && product.images[0]?.url) || '',
        });

        return NextResponse.json({ success: true, data: newSubscription }, { status: 201 });

    } catch (error) {
        console.error('POST /api/subscriptions error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, error: 'UserId is required' }, { status: 400 });
        }

        const subscriptions = await Subscription.find({ user: userId })
            .populate('product') // Populate product to get latest details
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: subscriptions }, { status: 200 });

    } catch (error) {
        console.error('GET /api/subscriptions error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { subscriptionId, status, quantity, preferredDay, preferredTime } = body;

        if (!subscriptionId) {
            return NextResponse.json({ success: false, error: 'SubscriptionId is required' }, { status: 400 });
        }

        const updates = {};
        if (status) updates.status = status;
        if (quantity) updates.quantity = quantity;
        if (preferredDay) updates.preferredDay = preferredDay;
        if (preferredTime) updates.preferredTime = preferredTime;
        
        // Recalculating nextOrderDate on update is complex, 
        // skipping for now unless specifically requested to reschedule immediately.

        const updated = await Subscription.findByIdAndUpdate(
            subscriptionId,
            { $set: updates },
            { new: true }
        );

        if (!updated) {
            return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updated }, { status: 200 });

    } catch (error) {
         console.error('PATCH /api/subscriptions error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
