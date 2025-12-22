import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import ComplianceReport from '@/lib/db/models/payroll/ComplianceReport';

// GET a compliance report by ID
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    const complianceReport = await ComplianceReport.findById(id)
    
    if (!complianceReport) {
      return NextResponse.json({ error: 'Compliance report not found' }, { status: 404 });
    }
    
    return NextResponse.json(complianceReport);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE a compliance report by ID
export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    const body = await request.json();
    
    // Validate fields against schema
    const allowedFields = [
      'reportType',
      'period',
      'complianceItems',
      'overallStatus',
      'reviewedBy',
      'approvedBy',
      'notes',
      'attachments'
    ];
    const updates = Object.keys(body).reduce((acc, key) => {
      if (allowedFields.includes(key)) {
        acc[key] = body[key];
      }
      return acc;
    }, {});
    
    const complianceReport = await ComplianceReport.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
    
    if (!complianceReport) {
      return NextResponse.json({ error: 'Compliance report not found' }, { status: 404 });
    }
    
    return NextResponse.json(complianceReport);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a compliance report by ID
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    const complianceReport = await ComplianceReport.findByIdAndDelete(id);
    
    if (!complianceReport) {
      return NextResponse.json({ error: 'Compliance report not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Compliance report deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}