import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import LeaveApplication from '@/lib/db/models/payroll/LeaveApplication';

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    const leaveType = searchParams.get('leaveType');
    
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;
    if (leaveType) filter.leaveType = leaveType;
    
    const leaves = await LeaveApplication.find(filter)
      .populate('employee', 'employeeId personalDetails.firstName personalDetails.lastName')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await LeaveApplication.countDocuments(filter);
    
    return NextResponse.json({
      leaves,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const leave = await LeaveApplication.create(body);
    
    await leave.populate('employee', 'employeeId personalDetails.firstName personalDetails.lastName');
    
    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}