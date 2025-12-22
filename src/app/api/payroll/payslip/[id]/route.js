import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Payslip from '@/lib/db/models/payroll/Payslip';
import Employee from '@/lib/db/models/payroll/Employee';

// GET payslip by ID
export async function GET(request, { params }) {
  try {
      const { id } = params;
    await dbConnect();
    
    const payslip = await Payslip.findById(id)
     .populate({
        path: 'employee',
        model: Employee,
        populate: [
          {
            path: 'personalDetails',
          },
          {
            path: 'jobDetails',
          },
          {
            path: 'salaryDetails',
            populate: {
              path: 'bankAccount'
            }
          }
        ]
      })
      .populate('generatedBy', 'name email')
      .populate('approvedBy', 'name email');
    
    
    if (!payslip) {
      return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
    }
    
    return NextResponse.json(payslip);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE payslip
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const payslip = await Payslip.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    )
      .populate('employee')
      .populate('generatedBy', 'name email')
      .populate('approvedBy', 'name email');
    
    if (!payslip) {
      return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
    }
    
    return NextResponse.json(payslip);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE payslip
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const payslip = await Payslip.findByIdAndDelete(params.id);
    
    if (!payslip) {
      return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Payslip deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}