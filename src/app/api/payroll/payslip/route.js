import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Payslip from '@/lib/db/models/payroll/Payslip';
import Employee from '@/lib/db/models/payroll/Employee';

// GET all payslips
export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;
    
    const payslips = await Payslip.find(filter)
      .populate('employee', 'employeeId personalDetails.firstName personalDetails.lastName jobDetails.department')
      .sort({ year: -1, month: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Payslip.countDocuments(filter);
    
    return NextResponse.json({
      payslips,
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

// /api/payroll/payslip/check - GET endpoint
// export async function GET(request) {
//   try {
//     await dbConnect();
    
//     const { searchParams } = new URL(request.url);
//     const employee = searchParams.get('employee');
//     const month = parseInt(searchParams.get('month'));
//     const year = parseInt(searchParams.get('year'));

//     // if (!employee || !month || !year) {
//     //   return NextResponse.json(
//     //     { error: 'Missing required parameters' },
//     //     { status: 400 }
//     //   );
//     // }

//     const existingPayslip = await Payslip.findOne({
//       employee,
//       month,
//       year,
//       status: { $ne: 'Cancelled' }
//     }).populate('employee', 'employeeId personalDetails.firstName personalDetails.lastName');

//     return NextResponse.json({ 
//       exists: !!existingPayslip,
//       payslip: existingPayslip 
//     });
//   } catch (error) {
//     console.error('Error checking payslip:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }


// CREATE new payslip
export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();

     // Check for existing payslip for the same employee, month, and year
    const existingPayslip = await Payslip.findOne({
      employee: body.employee,
      month: body.month,
      year: body.year,
      status: { $ne: 'Cancelled' } // Exclude cancelled payslips
    });

        if (existingPayslip) {
      return NextResponse.json(
        { 
          error: 'DUPLICATE_PAYSLIP',
          message: `A payslip for ${getMonthName(body.month)} ${body.year} already exists for this employee.`,
          existingPayslipId: existingPayslip._id
        }, 
        { status: 409 }
      );
    }
    
    
    // Generate unique payslip ID
    const count = await Payslip.countDocuments();
    const payslipId = `PSL${String(count + 1).padStart(6, '0')}`;
    
    const payslip = await Payslip.create({
      ...body,
      payslipId
    });
    
    return NextResponse.json(payslip, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          error: 'DUPLICATE_PAYSLIP',
          message: 'A payslip for this employee and period already exists.'
        }, 
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to get month name
function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
}


// await payslip.populate('employee', 'employeeId personalDetails.firstName personalDetails.lastName jobDetails.department');
