import { NextResponse } from 'next/server';
import  dbConnect  from '../../../../../lib/db/connect';
import Employee from '../../../../../lib/db/models/payroll/Employee';

export async function GET(request, { params }) {
  try {
    const {id}  =  params
    await dbConnect();
    
    const employee = await Employee.findById(id)

      console.log(employee);
      
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const {id}  =  params
    await dbConnect();
    const data = await request.json();
    
    const employee = await Employee.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const {id}  = params
    await dbConnect();
    
    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}