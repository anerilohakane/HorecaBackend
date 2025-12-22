// import { NextResponse } from 'next/server';
// import dbConnect from '@/lib/db/connect';
// import User from '@/lib/db/models/User';
// import Employee from '@/lib/db/models/payroll/Employee';
// import jwt from 'jsonwebtoken';

// const JWT_SECRET = process.env.JWT_SECRET;

// export async function GET(req) {
//   try {
//     if (!JWT_SECRET) {
//       console.error('JWT_SECRET is not set');
//       return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
//     }

//     await dbConnect();

//     // Get the authToken cookie
//     const token = req.cookies.get('authToken')?.value;

//     console.log("token from session  : ",token);

//     if (!token) {
//       return NextResponse.json({ message: 'No session found' }, { status: 401 });
//     }

    
//     // Verify and decode the JWT
//     let decoded;
//     try {
//       decoded = jwt.verify(token, JWT_SECRET);
//     } catch (error) {
//       console.error('Invalid token:', error);
//       return NextResponse.json({ message: 'Invalid or expired session' }, { status: 401 });
//     }

//     const { email, department } = decoded;


//     console.log("Email And Dept from Session Route : -", email, department);
    
//     // Handle admin user
//     if (department === 'admin') {
    
//       const user = await User.findOne({ email }).lean();
//       if (!user) {
//         return NextResponse.json({ message: 'User not found' }, { status: 401 });
//       }

//       console.log("user From Auth/session : ",user);
      
//       // Ensure user is still an admin
//       const isAdminUser = (user.role && user.role.toLowerCase() === 'admin') ||
//                           (user.department && user.department.toLowerCase() === 'admin');
//       if (!isAdminUser) {
//         return NextResponse.json({ message: 'Unauthorized for admin access' }, { status: 403 });
//       }

//       return NextResponse.json({
//         user: {
//           id: user._id.toString(),
//           email: user.email,
//           department: 'admin',
//         },
//       });
//     }

//     // Handle employee user
//       const allowedDepartments = ['odt', 'art', 'scm', 'acc'];
//       if (!allowedDepartments.includes(department.toLowerCase())) {
//         return NextResponse.json({ message: 'Invalid department' }, { status: 400 });
//       }

//        const employee = await Employee.findOne({ 'personalDetails.email': new RegExp(`^${email}$`, 'i') });
//       if (!employee) {
//         return NextResponse.json({ message: 'Employee not found' }, { status: 401 });
//       }

//       // Verify department matches
//       const empDept = (employee.jobDetails?.department || '').toString().trim().toLowerCase();
//       if (empDept !== department.toLowerCase()) {
//         return NextResponse.json({ message: 'Invalid department' }, { status: 401 });
//       }

//       return NextResponse.json({
//         user: {
//           id: employee._id.toString(),
//           email: employee.personalDetails.email,
//           role: 'employee',
//           department: employee.jobDetails.department,
//           personalDetails: {
//             firstName: employee.personalDetails.firstName,
//             lastName: employee.personalDetails.lastName,
//           },
//         },
//       });
    

//     return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
//   } catch (error) {
//     console.error('Session fetch error:', error);
//     return NextResponse.json({ message: 'Server error: ' + error.message }, { status: 500 });
//   }
// }

// src/app/api/auth/session/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import User from '@/lib/db/models/User';
import Employee from '@/lib/db/models/payroll/Employee';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req) {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    await dbConnect();

    // Get the authToken cookie
    const token = req.cookies.get('authToken')?.value;

    console.log("Token from cookie: ", token);

    if (!token) {
      return NextResponse.json({ message: 'No session found' }, { status: 401 });
    }

    // Verify and decode the JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error('Invalid token:', error);
      return NextResponse.json({ message: 'Invalid or expired session' }, { status: 401 });
    }

    const { id, department } = decoded;

    console.log("Decoded token: ", { id, department });

    // Handle admin user
    if (department === 'admin') {
      // Find user by ID and sessionToken
      const user = await User.findOne({ _id: id, sessionToken: token }).lean();

      console.log("User :- ", user);
      
      if (!user) {
        return NextResponse.json({ message: 'User session not found or invalid' }, { status: 401 });
      }

      // Ensure user is still an admin
      const isAdminUser = (user.role && user.role.toLowerCase() === 'admin') ||
                          (user.department && user.department.toLowerCase() === 'admin');
      if (!isAdminUser) {
        return NextResponse.json({ message: 'Unauthorized for admin access' }, { status: 403 });
      }

      return NextResponse.json({
        user: {
          id: user._id.toString(),
          name:user.name,
          role: user.department,
          email: user.email,
          department: 'admin',
        },
      });
    }

    // Handle employee user
    const allowedDepartments = ['odt', 'art', 'scm', 'acc'];
    if (allowedDepartments.includes(department.toLowerCase())) {
      // Find employee by ID and sessionToken
      const employee = await Employee.findOne({ _id: id, sessionToken: token }).lean();

      console.log("Employee : -",employee);
      
      if (!employee) {
        return NextResponse.json({ message: 'Employee session not found or invalid' }, { status: 401 });
      }

      // Verify department matches
      const empDept = (employee.jobDetails?.department || '').toString().trim().toLowerCase();
      if (empDept !== department.toLowerCase()) {
        return NextResponse.json({ message: 'Invalid department' }, { status: 401 });
      }

      return NextResponse.json({
        user: {
          id: employee._id.toString(),
          email: employee.personalDetails.email,
          role:  employee.jobDetails.designation,
          department: employee.jobDetails.department,
          personalDetails: {
            firstName: employee.personalDetails.firstName,
            lastName: employee.personalDetails.lastName,
          },
        },
      });
    }

    return NextResponse.json({ message: 'Invalid role or department' }, { status: 400 });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ message: 'Server error: ' + error.message }, { status: 500 });
  }
}