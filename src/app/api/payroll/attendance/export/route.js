import Attendance from "@/lib/db/models/payroll/Attendance";
import Employee from "@/lib/db/models/payroll/Employee";
import dbConnect from "@/lib/db/connect";

export async function GET(request) {
  try {
    await dbConnect();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const employeeId = searchParams.get('employeeId');

    // Build query based on filters
    let query = {};
    
    // Date range filter
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Employee filter
    if (employeeId) {
      query.employee = employeeId;
    }

    // Role-based access control
    let employeeQuery = {};
    if (session.user.role === 'Supervisor') {
      employeeQuery = { 'jobDetails.department': session.user.department };
    }

    // Fetch employees based on role
    const employees = await Employee.find(employeeQuery).select('_id');
    const employeeIds = employees.map(emp => emp._id);

    // Add employee filter to query
    if (employeeIds.length > 0) {
      query.employee = { $in: employeeIds };
    }

    // Fetch attendance data with employee details
    const attendance = await Attendance.find(query)
      .populate({
        path: "employee",
        select: "employeeId personalDetails jobDetails",
      })
      .sort({ date: -1 })
      .lean();

    // Transform data for response
    const transformedAttendance = attendance.map(record => ({
      _id: record._id,
      date: record.date,
      status: record.status,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      lateHours: record.lateHours,
      overtime: record.overtime,
      remarks: record.remarks,
      employee: record.employee ? {
        employeeId: record.employee.employeeId,
        personalDetails: record.employee.personalDetails,
        jobDetails: record.employee.jobDetails
      } : null
    }));

    return new Response(JSON.stringify({
      success: true,
      attendance: transformedAttendance,
      count: transformedAttendance.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Export API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}