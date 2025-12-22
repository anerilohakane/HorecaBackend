//src/app/api/payroll/employees/[id]/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Employee from '@/lib/db/models/payroll/Employee';
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET all employees
export async function GET(request) {
  try {
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    if (department) {
      filter['jobDetails.department'] = department;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { employeeId: { $regex: search, $options: 'i' } },
        { 'personalDetails.firstName': { $regex: search, $options: 'i' } },
        { 'personalDetails.lastName': { $regex: search, $options: 'i' } },
        { 'personalDetails.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    const employees = await Employee.find(filter)
      .populate('jobDetails.reportingManager', 'personalDetails.firstName personalDetails.lastName employeeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Employee.countDocuments(filter);
    
    return NextResponse.json({
      employees,
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

// CREATE new employee
export async function POST(request) {
  try {
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    await dbConnect();
    
    const body = await request.json();
    

    const lastEmployee = await Employee.findOne().sort({ employeeId: -1 });
    let newEmployeeId = "EMP001"; // Default starting ID

     if (lastEmployee && lastEmployee.employeeId) {
      // Extract number from existing employee ID and increment
      const lastIdNumber = parseInt(lastEmployee.employeeId.replace('EMP', '')) || 0;
      newEmployeeId = `EMP${String(lastIdNumber + 1).padStart(3, '0')}`;
    }

    const existingEmployee = await Employee.findOne({ 
      employeeId: newEmployeeId 
    });

   if (existingEmployee) {
      // If by chance it exists, find the next available ID
      const allEmployees = await Employee.find({}, 'employeeId').sort({ employeeId: 1 });
      let nextId = 1;
      
      for (const emp of allEmployees) {
        const empNumber = parseInt(emp.employeeId.replace('EMP', '')) || 0;
        if (empNumber >= nextId) {
          nextId = empNumber + 1;
        }
      }
      
      newEmployeeId = `EMP${String(nextId).padStart(3, '0')}`;
    }
    
    // Check if email already exists
    const existingEmail = await Employee.findOne({ 
      'personalDetails.email': body.personalDetails.email 
    });
    
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' }, 
        { status: 400 }
      );
    }
    
    const employee = await Employee.create({
      ...body,
       employeeId: newEmployeeId 
    });
    
    await employee.populate('jobDetails.reportingManager', 'personalDetails.firstName personalDetails.lastName employeeId');
    
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}