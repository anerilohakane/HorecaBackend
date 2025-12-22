import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Payslip from '@/lib/db/models/payroll/Payslip';

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const reportType = searchParams.get('type'); // PF, ESIC, PT
    
    // Generate statutory reports based on type
    let reportData = [];
    
    switch (reportType) {
      case 'PF':
        reportData = await generatePFReport(month, year);
        break;
      case 'ESIC':
        reportData = await generateESICReport(month, year);
        break;
      case 'PT':
        reportData = await generatePTReport(month, year);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
    
    return NextResponse.json({ report: reportData });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generatePFReport(month, year) {
  // Implement PF report generation logic
  const pfData = await Payslip.aggregate([
    {
      $match: {
        month: parseInt(month),
        year: parseInt(year),
        isPFApplicable: true
      }
    },
    {
      $group: {
        _id: '$employee',
        totalEmployeeContribution: { $sum: '$pfDetails.employeeContribution' },
        totalEmployerContribution: { $sum: '$pfDetails.employerContribution' },
        totalPensionContribution: { $sum: '$pfDetails.pensionContribution' }
      }
    }
  ]);
  
  return pfData;
}