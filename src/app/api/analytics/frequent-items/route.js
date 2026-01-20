
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Order from '@/lib/db/models/order';
import Product from '@/lib/db/models/product';
import connectDB from '@/lib/db/connect';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Aggregate orders to find frequently bought items
    const frequentItems = await Order.aggregate([
      // 1. Match orders for this user & not cancelled
      { 
        $match: { 
          user: userObjectId,
          status: { $nin: ['cancelled', 'failed', 'returned'] } 
        } 
      },
      // 2. Unwind items array
      { $unwind: '$items' },
      // 3. Group by product ID
      {
        $group: {
          _id: '$items.product',
          count: { $sum: 1 },
          lastBoughtAt: { $max: '$createdAt' }
        }
      },
      // 4. Sort by purchase count (descending)
      { $sort: { count: -1 } },
      // 5. Limit to top 10
      { $limit: 10 }
    ]);

    // Populate product details
    const productIds = frequentItems.map(item => item._id);
    const products = await Product.find({ _id: { $in: productIds } });

    // Combine aggregation data with product details
    const result = frequentItems
      .map(item => {
        const product = products.find(p => p._id.toString() === item._id.toString());
        if (!product) return null;
        return {
          ...product.toObject(),
          purchaseCount: item.count,
          lastBoughtAt: item.lastBoughtAt
        };
      })
      .filter(item => item !== null);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching frequent items:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
