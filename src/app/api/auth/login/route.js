// // src/app/api/auth/login/route.js
// import { NextResponse } from 'next/server';
// import dbConnect from '@/lib/db/connect';
// import User from '@/lib/db/models/User';
// import Employee from '@/lib/db/models/payroll/Employee';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';

// const JWT_SECRET = process.env.JWT_SECRET;
// const TOKEN_MAX_AGE = 2 * 60 * 60; // seconds (2 hours)

// export async function POST(req) {
//   try {
//     if (!JWT_SECRET) {
//       console.error('JWT_SECRET is not set');
//       return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
//     }

//     await dbConnect();

//     const body = await req.json();
//     const username = (body.username || '').toString();
//     const password = (body.password || '').toString();
//     const departmentRaw = (body.department || body.role || '').toString();

//     const email = username.trim().toLowerCase();
//     const department = departmentRaw.trim().toLowerCase();

//     console.log("body",body);
    

//     console.log('Login attempt:', email, department);

//     if (!email || !password || !department) {
//       return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
//     }

//     // --- ADMIN LOGIN ---
//     if (department === 'admin') {
//       // find user by email (then check role/department)
//       const user = await User.findOne({ email }).lean();
//       if (!user) {
//         return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
//       }

//       // ensure this user is allowed as admin (either role === 'admin' or department === 'admin')
//       const isAdminUser = (user.role && user.role.toLowerCase() === 'admin') ||
//                           (user.department && user.department.toLowerCase() === 'admin');

//       if (!isAdminUser) {
//         return NextResponse.json({ message: 'Unauthorized for admin access' }, { status: 403 });
//       }

//       // verify password (bcrypt)
//       if (!user.password) {
//         return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
//       }

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
//       }

//       const token = jwt.sign(
//         { id: user._id.toString(), role: 'admin', department: 'admin' },
//         JWT_SECRET,
//         { expiresIn: TOKEN_MAX_AGE }
//       );

//       const res = NextResponse.json({
//         user: { id: user._id.toString(), email: user.email, role: 'admin', department: 'admin' }
//       });

//       res.cookies.set('authToken', token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'lax',
//         path: '/',
//         maxAge: TOKEN_MAX_AGE
//       });

//       console.log('Admin login success:', email);
//       return res;
//     }

//     // --- EMPLOYEE LOGIN (ODT / ART / SCM / ACC) ---
//     const allowed = ['odt','art','scm','acc'];
//     if (allowed.includes(department)) {
//       // find employee by email
//       const employee = await Employee.findOne({ 'personalDetails.email': new RegExp(`^${email}$`, 'i') });
//       if (!employee) {
//         return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
//       }

//       // check department (case-insensitive)
//       const empDept = (employee.jobDetails?.department || '').toString().trim().toLowerCase();
//       if (empDept !== department) {
//         return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
//       }

//       // get DOB and normalize to YYYY-MM-DD
//       const rawDob = employee.personalDetails?.dateOfBirth;
//       if (!rawDob) {
//         return NextResponse.json({ message: 'Employee DOB not available' }, { status: 500 });
//       }
//       // Safely parse date (works if stored as Date or string)
//       const dobDate = new Date(rawDob);
//       if (isNaN(dobDate.getTime())) {
//         return NextResponse.json({ message: 'Employee DOB format invalid' }, { status: 500 });
//       }
//       const dobString = dobDate.toISOString().split('T')[0]; // YYYY-MM-DD

//       // compare password (which for employees is DOB in YYYY-MM-DD)
//       if (dobString !== password) {
//         return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
//       }

//       // create token and set cookie
//       const token = jwt.sign(
//         { id: employee._id.toString(), role: 'employee', department: employee.jobDetails.department },
//         JWT_SECRET,
//         { expiresIn: TOKEN_MAX_AGE }
//       );

//       const res = NextResponse.json({
//         user: {
//           id: employee._id.toString(),
//           email: employee.personalDetails.email,
//           role: 'employee',
//           department: employee.jobDetails.department,
//           personalDetails: {
//             firstName: employee.personalDetails.firstName,
//             lastName: employee.personalDetails.lastName
//           }
//         }
//       });

//       res.cookies.set('authToken', token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'lax',
//         path: '/',
//         maxAge: TOKEN_MAX_AGE
//       });

//       console.log('Employee login success:', email, 'dept:', department);
//       return res;
//     }

//     return NextResponse.json({ message: 'Invalid department' }, { status: 400 });

//   } catch (err) {
//     console.error('Login error:', err);
//     return NextResponse.json({ message: 'Server error: ' + err.message }, { status: 500 });
//   }
// }



// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import User from '@/lib/db/models/User';
import Employee from '@/lib/db/models/payroll/Employee';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_MAX_AGE = 2 * 60 * 60; // seconds (2 hours)

export async function POST(req) {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    await dbConnect();

    const body = await req.json();
    const username = (body.username || '').toString();
    const password = (body.password || '').toString();
    const departmentRaw = (body.department || body.role || '').toString();

    const email = username.trim().toLowerCase();
    const department = departmentRaw.trim().toLowerCase();

    console.log("body", body);
    console.log('Login attempt:', email, department);

    if (!email || !password || !department) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    // --- ADMIN LOGIN ---
    if (department === 'admin') {
      // Find user by email (then check role/department)
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }

      // Ensure this user is allowed as admin (either role === 'admin' or department === 'admin')
      const isAdminUser = (user.role && user.role.toLowerCase() === 'admin') ||
                          (user.department && user.department.toLowerCase() === 'admin');

      if (!isAdminUser) {
        return NextResponse.json({ message: 'Unauthorized for admin access' }, { status: 403 });
      }

      // Verify password (bcrypt)
      if (!user.password) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }

      // Create token
      const token = jwt.sign(
        { id: user._id.toString(), department: 'admin' },
        JWT_SECRET,
        { expiresIn: TOKEN_MAX_AGE }
      );

      // Update user with sessionToken
      await User.updateOne(
        { _id: user._id },
        { $set: { sessionToken: token } }
      );

      const res = NextResponse.json({
        user: { id: user._id.toString(), email: user.email, department: 'admin' }
      });

      res.cookies.set('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: TOKEN_MAX_AGE
      });

      console.log('Admin login success:', email);
      return res;
    }

    // --- EMPLOYEE LOGIN (ODT / ART / SCM / ACC) ---
    const allowed = ['odt', 'art', 'scm', 'acc'];
    if (allowed.includes(department)) {
      // Find employee by email
      const employee = await Employee.findOne({ 'personalDetails.email': new RegExp(`^${email}$`, 'i') });
      if (!employee) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }

      // Check department (case-insensitive)
      const empDept = (employee.jobDetails?.department || '').toString().trim().toLowerCase();
      if (empDept !== department) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }

      // Get DOB and normalize to YYYY-MM-DD
      const rawDob = employee.personalDetails?.dateOfBirth;
      if (!rawDob) {
        return NextResponse.json({ message: 'Employee DOB not available' }, { status: 500 });
      }
      // Safely parse date (works if stored as Date or string)
      const dobDate = new Date(rawDob);
      if (isNaN(dobDate.getTime())) {
        return NextResponse.json({ message: 'Employee DOB format invalid' }, { status: 500 });
      }
      const dobString = dobDate.toISOString().split('T')[0]; // YYYY-MM-DD

      // Compare password (which for employees is DOB in YYYY-MM-DD)
      if (dobString !== password) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }

      // Create token
      const token = jwt.sign(
        { id: employee._id.toString(), designation: employee.jobDetails.designation, department: employee.jobDetails.department },
        JWT_SECRET,
        { expiresIn: TOKEN_MAX_AGE }
      );

      // Update employee with sessionToken
      await Employee.updateOne(
        { _id: employee._id },
        { $set: { sessionToken: token } }
      );

      const res = NextResponse.json({
        user: {
          id: employee._id.toString(),
          email: employee.personalDetails.email,
          role:  employee.jobDetails.designation,
          department: employee.jobDetails.department,
          personalDetails: {
            firstName: employee.personalDetails.firstName,
            lastName: employee.personalDetails.lastName
          }
        }
      });

      res.cookies.set('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: TOKEN_MAX_AGE
      });

      console.log('Employee login success:', email, 'dept:', department);
      return res;
    }

    return NextResponse.json({ message: 'Invalid department' }, { status: 400 });

  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Server error: ' + err.message }, { status: 500 });
  }
}