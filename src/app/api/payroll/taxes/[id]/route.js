import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import TaxCalculation from '@/lib/db/models/payroll/TaxCalculation';
import Employee from '@/lib/db/models/payroll/Employee';
import User from '@/lib/db/models/User';

// GET tax calculation by ID
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const taxCalculation = await TaxCalculation.findById(id)
      .populate({
        path: 'employee',
        select: 'employeeId personalDetails.firstName personalDetails.lastName personalDetails.email personalDetails.phone',
        model: Employee
      })
      .populate({
        path: 'calculatedBy',
        select: 'name email phoneNumber',
        model: User
      })
      .populate({
        path: 'reviewedBy',
        select: 'name email phoneNumber',
        model: User
      })
      .populate({
        path: 'approvedBy',
        select: 'name email phoneNumber',
        model: User
      });

    if (!taxCalculation) {
      return NextResponse.json({ error: 'Tax calculation not found' }, { status: 404 });
    }

    return NextResponse.json(taxCalculation);
  } catch (error) {
    console.error('Error fetching tax calculation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE tax calculation by ID
export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    const body = await request.json();
    
    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Validate fields against schema
    const allowedFields = [
      'financialYear',
      'totalEarnings',
      'totalDeductions',
      'taxableIncome',
      'taxDetails',
      'totalTax',
      'status',
      'reviewedBy',
      'approvedBy',
      'notes'
    ];
    const updates = Object.keys(body).reduce((acc, key) => {
      if (allowedFields.includes(key)) {
        acc[key] = body[key];
      }
      return acc;
    }, {});
    
    const taxCalculation = await TaxCalculation.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'employee',
        select: 'employeeId personalDetails.firstName personalDetails.lastName personalDetails.email personalDetails.phone',
        model: Employee
      })
      .populate({
        path: 'calculatedBy',
        select: 'name email phoneNumber',
        model: User
      })
      .populate({
        path: 'reviewedBy',
        select: 'name email phoneNumber',
        model: User
      })
      .populate({
        path: 'approvedBy',
        select: 'name email phoneNumber',
        model: User
      });
    
    if (!taxCalculation) {
      return NextResponse.json({ error: 'Tax calculation not found' }, { status: 404 });
    }
    
    return NextResponse.json(taxCalculation);
  } catch (error) {
    console.error('Error updating tax calculation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE tax calculation by ID
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const taxCalculation = await TaxCalculation.findByIdAndDelete(id);
    
    if (!taxCalculation) {
      return NextResponse.json({ error: 'Tax calculation not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Tax calculation deleted successfully' });
  } catch (error) {
    console.error('Error deleting tax calculation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}