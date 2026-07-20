import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/connect';
import Order from '@/lib/db/models/order';
import Department from '@/lib/db/models/Department';
import Notification from '@/lib/db/models/Notification'; // Assuming a Notification model exists

export async function GET(request) {
  try {
    await dbConnect();

    // Verify Vercel Cron Secret for security if deployed
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // In production, enforce cron secret
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Find the ART department ID
    const artDept = await Department.findOne({ departmentName: { $regex: /^art$/i } }).lean();
    // Find the SCM department ID
    const scmDept = await Department.findOne({ departmentName: { $regex: /^scm$/i } }).lean();

    if (!artDept || !scmDept) {
      return NextResponse.json({ success: false, error: 'ART or SCM department not found' }, { status: 500 });
    }

    // Find all orders in ART that have been approved
    const orders = await Order.find({
      department: artDept._id,
      artApproved: true,
      status: { $nin: ['cancelled', 'returned'] } // Exclude cancelled ones
    });

    if (orders.length === 0) {
      return NextResponse.json({ success: true, message: 'No approved orders to dispatch', count: 0 });
    }

    const orderIds = orders.map(o => o._id);

    // Update all matching orders
    const historyEntry = {
      from: artDept._id,
      to: scmDept._id,
      updatedAt: new Date(),
      notes: 'Automated 7 PM Dispatch: Moved to SCM for Packaging',
      updatedBy: null // System
    };

    const updateResult = await Order.updateMany(
      { _id: { $in: orderIds } },
      { 
        $set: { 
          department: scmDept._id,
          status: 'Packaging'
        },
        $push: { departmentHistory: historyEntry }
      }
    );

    // Notify ART team
    try {
      if (mongoose.models.Notification) {
        await mongoose.models.Notification.create({
          title: 'Evening Dispatch Completed',
          message: `${orders.length} approved orders have been automatically sent to SCM.`,
          type: 'SYSTEM',
          targetDepartments: [artDept._id], // Assuming notification system supports this
          isRead: false
        });
      }
    } catch (notifErr) {
      console.warn("Failed to create notification, ignoring:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully dispatched ${orders.length} orders to SCM`,
      count: orders.length,
      orderIds
    });

  } catch (error) {
    console.error('CRON ERROR /api/cron/dispatch-art-to-scm:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
