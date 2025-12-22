import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Attendance from '@/lib/db/models/payroll/Attendance';

export async function GET(request) {
  try {
    await dbConnect();
    
     const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const date = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    if (date) filter.date = new Date(date);
    if (employeeId) filter.employee = employeeId;
    if (status) filter.status = status;

     if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    console.log("Filter Data ",filter)

    const attendance = await Attendance.find(filter)
      .populate('employee', 'employeeId personalDetails.firstName personalDetails.lastName')
      .populate('proxyDetails.markedBy', 'name')
      .populate('proxyDetails.approvedBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);


    console.log("Attendance : -",attendance)

    const total = await Attendance.countDocuments(filter);
    
    return NextResponse.json({
      attendance,
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
    const { employee, date, status, checkIn } = body;

    console.log(employee, date, status, checkIn );
    
    
    if (!employee || !date) {
      return NextResponse.json({ error: 'Employee and date are required' }, { status: 400 });
    }
    if (status === 'Present' && !checkIn) {
      return NextResponse.json({ error: 'Check-in time is required for Present status' }, { status: 400 });
    }
    if (!['Present', 'Absent', 'Leave', 'Weekend'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const existingAttendance = await Attendance.findOne({ employee, date: new Date(date) });
    if (existingAttendance) {
      return NextResponse.json({ error: 'Attendance record already exists for this employee and date' }, { status: 409 });
    }

    const attendance = await Attendance.create(body);
    await attendance.populate('employee', 'employeeId personalDetails.firstName personalDetails.lastName');
    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { employee, date, checkOut } = body;

    console.log(employee, date, checkOut);
    

    if (!employee || !date || !checkOut) {
      return NextResponse.json({ error: 'Employee, date, and checkOut are required' }, { status: 400 });
    }

    const attendance = await Attendance.findOne({ employee, date: new Date(date) });
    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }
    if (!attendance.checkIn) {
      return NextResponse.json({ error: 'Cannot set check-out without check-in' }, { status: 400 });
    }

    const checkOutTime = new Date(checkOut);
    const checkInTime = new Date(attendance.checkIn);
    if (checkOutTime <= checkInTime) {
      return NextResponse.json({ error: 'Check-out time must be later than check-in time' }, { status: 400 });
    }

    const totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert milliseconds to hours

    const updatedAttendance = await Attendance.findOneAndUpdate(
      { employee, date: new Date(date) },
      { $set: { checkOut: checkOutTime, totalHours } },
      { new: true }
    ).populate('employee', 'employeeId personalDetails.firstName personalDetails.lastName');

    return NextResponse.json(updatedAttendance);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}















// // app/api/payroll/attendance/route.js
// import { NextResponse } from 'next/server';
// import dbConnect from '@/lib/db/connect';
// import Attendance from '@/lib/db/models/payroll/Attendance';

// export async function GET(request) {
//   try {
//     await dbConnect();
//     const { searchParams } = new URL(request.url);
//     const page = parseInt(searchParams.get('page') || '1');
//     const limit = parseInt(searchParams.get('limit') || '30');
//     const date = searchParams.get('date');
//     const employeeId = searchParams.get('employeeId');
//     const status = searchParams.get('status');
//     const skip = (page - 1) * limit;
//     let filter = {};
//     if (date) filter.date = new Date(date);
//     if (employeeId) filter.employee = employeeId;
//     if (status) filter.status = status;
//     const attendance = await Attendance.find(filter)
//       .populate('employee', 'employeeId personalDetails.firstName personalDetails.lastName')
//       .populate('proxyDetails.markedBy', 'name')
//       .populate('proxyDetails.approvedBy', 'name')
//       .sort({ date: -1 })
//       .skip(skip)
//       .limit(limit);
//     const total = await Attendance.countDocuments(filter);
//     return NextResponse.json({
//       attendance,
//       pagination: { page, limit, total, pages: Math.ceil(total / limit) },
//     });
//   } catch (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// export async function POST(request) {
//   try {
//     await dbConnect();
//     const body = await request.json();
//     const existingRecord = await Attendance.findOne({
//       employee: body.employee,
//       date: new Date(body.date),
//     });
//     if (existingRecord) {
//       return NextResponse.json({ error: 'Attendance record already exists for this employee and date' }, { status: 400 });
//     }
//     const attendance = await Attendance.create(body);
//     await attendance.populate('employee', 'employeeId personalDetails.firstName personalDetails.lastName');
//     return NextResponse.json(attendance, { status: 201 });
//   } catch (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// export async function PATCH(request) {
//   try {
//     await dbConnect();
//     const body = await request.json();
//     const { employee, date, checkOut } = body;
//     if (!employee || !date || !checkOut) {
//       return NextResponse.json({ error: 'Employee, date, and checkOut are required' }, { status: 400 });
//     }
//     const attendance = await Attendance.findOneAndUpdate(
//       { employee, date: new Date(date) },
//       { $set: { checkOut: new Date(checkOut) } },
//       { new: true }
//     ).populate('employee', 'employeeId personalDetails.firstName personalDetails.lastName');
//     if (!attendance) {
//       return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
//     }
//     return NextResponse.json(attendance);
//   } catch (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }