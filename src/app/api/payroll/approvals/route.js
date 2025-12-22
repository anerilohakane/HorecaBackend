import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import ApprovalWorkflow from '@/lib/db/models/payroll/ApprovalWorkflow';

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    
    let filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    const approvals = await ApprovalWorkflow.find(filter)
      .populate('steps.approver', 'name email')
      .populate('initiatedBy', 'name email')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ approvals });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}