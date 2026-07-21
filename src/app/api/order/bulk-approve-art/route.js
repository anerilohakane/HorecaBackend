import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Order from '@/lib/db/models/order';
import Department from '@/lib/db/models/Department';
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    await dbConnect();
    
    // Find ART department
    const artDept = await Department.findOne({ departmentName: { $regex: new RegExp('^ART$', 'i') } }).lean();
    // Find SCM department
    const scmDept = await Department.findOne({ departmentName: { $regex: new RegExp('^SCM$', 'i') } }).lean();

    if (!artDept || !scmDept) {
      return NextResponse.json({ success: false, error: 'ART or SCM department not found in database' }, { status: 400 });
    }

    const artId = new mongoose.Types.ObjectId(artDept._id);
    const scmId = new mongoose.Types.ObjectId(scmDept._id);

    // Parse request body for optional changedBy userId
    let changedBy = 'System (Bulk ART Transfer)';
    try {
      const body = await request.json();
      if (body.changedBy) changedBy = body.changedBy;
    } catch (e) {
      // Body is optional
    }

    // Find all orders currently in ART department
    // Note: status might be 'verified' or similar when arriving at ART
    // We fetch them first to append to their departmentHistory properly.
    const orders = await Order.find({ department: artId, status: { $nin: ['Cancelled', 'failed', 'returned', 'Delivered', 'delivered'] } });
    
    if (orders.length === 0) {
      return NextResponse.json({ success: true, message: 'No pending orders in ART to transfer', count: 0 });
    }

    const historyEntry = {
      from: artId,
      to: scmId,
      updatedAt: new Date(),
      notes: 'Bulk approved by ART, moved to SCM for Packaging',
      updatedBy: changedBy
    };

    // Perform bulk update
    const updateResult = await Order.updateMany(
      { department: artId, status: { $nin: ['Cancelled', 'failed', 'returned', 'Delivered', 'delivered'] } },
      { 
        $set: { department: scmId, status: 'Packaging' },
        $push: { departmentHistory: historyEntry }
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: `Successfully transferred  orders to SCM`,
      count: updateResult.modifiedCount
    });

  } catch (error) {
    console.error('Bulk ART to SCM transfer error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}