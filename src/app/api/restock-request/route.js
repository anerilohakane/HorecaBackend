import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import RestockRequest from '@/lib/db/models/RestockRequest';
import User from '@/lib/db/models/User';
import Product from '@/lib/db/models/product';

export async function POST(request) {
    await dbConnect();
    
    try {
        const body = await request.json();
        const { userId, productId } = body;

        if (!userId || !productId) {
            return NextResponse.json({ success: false, error: "userId and productId are required" }, { status: 400 });
        }

        // Validate user exists
        const userExists = await User.findById(userId).lean();
        if (!userExists) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // Validate product exists
        const productExists = await Product.findById(productId).lean();
        if (!productExists) {
            return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
        }

        // Check for existing pending request to avoid duplicates
        const existingRequest = await RestockRequest.findOne({ user: userId, product: productId, status: 'pending' }).lean();
        
        if (existingRequest) {
            return NextResponse.json({ success: true, message: "You are already in queue to be notified.", existing: true });
        }

        // Create new restock request
        const newRequest = await RestockRequest.create({
            user: userId,
            product: productId,
            status: 'pending'
        });

        return NextResponse.json({ success: true, message: "We will notify you when this is back in stock!", data: newRequest });
        
    } catch (error) {
        // Handle unique constraint error elegantly if it happens concurrently
        if (error.code === 11000) {
             return NextResponse.json({ success: true, message: "You are already in queue to be notified.", existing: true });
        }
        console.error("POST /api/restock-request error:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to submit request" }, { status: 500 });
    }
}
