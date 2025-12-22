//src/app/api/payroll/compliance/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import ComplianceReport from '@/lib/db/models/payroll/ComplianceReport';

// GET all compliance reports
export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const reportType = searchParams.get('reportType');
    const status = searchParams.get('status');
    
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    if (reportType) filter.reportType = reportType;
    if (status) filter.overallStatus = status;
    
    const complianceReports = await ComplianceReport.find(filter)
      .sort({ 'period.from': -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await ComplianceReport.countDocuments(filter);
    
    return NextResponse.json({
      complianceReports,
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

// CREATE new compliance report
export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Generate unique report ID
    const count = await ComplianceReport.countDocuments();
    const reportId = `COMP${String(count + 1).padStart(6, '0')}`;
    
    const complianceReport = await ComplianceReport.create({
      ...body,
      reportId
    });
    
    
    return NextResponse.json(complianceReport, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}