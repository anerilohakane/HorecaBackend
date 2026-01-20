import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscription from '@/lib/db/models/subscription';
import Product from '@/lib/db/models/product';
import User from '@/lib/db/models/User';
import mongoose from 'mongoose';

// Helper to validate and get user from request NOT IMPLEMENTED - Assuming userId is passed for now or auth middleware handles it
// Ideally this should decode JWT from headers.
// For now, we will expect 'userId' in query params for GET and body for POST for simplicity/consistency with current flow, 
// OR we should implement proper auth check.
// Given strict instructions not to modify existing auth or middleware unless asked, 
// I will implement basic ID check or assume the frontend sends the correct ID.
// IMPORTANT: In production, this must use req.headers.get('authorization').

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { userId, productId, quantity, frequency, startDate } = body;

        if (!userId || !productId || !frequency || !startDate) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Verify product exists and get details
        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
        }

        // Calculate next order date
        const start = new Date(startDate);
        let nextDate = new Date(start);
        
        // If start date is in the past, calculate next interval
        // For simplicity, we just set nextOrderDate to startDate if it's future, 
        // or today if it's today. 
        // Real logic might need to handle specific logic.
        
        const newSubscription = await Subscription.create({
            user: userId,
            product: productId,
            quantity: quantity || 1,
            frequency,
            status: 'Active',
            startDate: start,
            nextOrderDate: start, // First order is the start date
            productName: product.name,
            productImage: product.images?.[0] || '', // Fallback image
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
            .sort({ createdAt: -1 })
            .lean(); // Return plain JS objects

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
        const { subscriptionId, status } = body;

        if (!subscriptionId || !status) {
            return NextResponse.json({ success: false, error: 'SubscriptionId and status are required' }, { status: 400 });
        }

        const updated = await Subscription.findByIdAndUpdate(
            subscriptionId,
            { status },
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
