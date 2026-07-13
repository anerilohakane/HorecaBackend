import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import mongoose from 'mongoose';

const OrderDispatchSchema = new mongoose.Schema({}, { strict: false });
const OrderDispatchRecord = mongoose.models.OrderDispatchRecord || mongoose.model('OrderDispatchRecord', OrderDispatchSchema, 'orderdispatchrecords');

// GET /api/order-dispatch?orderId=X or ?orderIds=X,Y,Z
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const orderIdsParam = searchParams.get('orderIds');

    let query = {};
    if (orderId) {
      query.orderId = orderId;
    } else if (orderIdsParam) {
      const ids = orderIdsParam.split(',').map(id => id.trim()).filter(Boolean);
      if (ids.length > 0) {
        query.orderId = { $in: ids };
      }
    }

    const records = await OrderDispatchRecord.find(query).lean();
    return NextResponse.json({ success: true, records });
  } catch (err) {
    console.error('[GET /api/order-dispatch] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
