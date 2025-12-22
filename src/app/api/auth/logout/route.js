// // src/app/api/auth/logout/route.js
// import { NextResponse } from 'next/server';

// export async function POST() {
//   const res = NextResponse.json({ message: 'Logged out successfully' });

//   // ✅ Clear cookie
//   res.cookies.set('authToken', '', {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     path: '/',
//     expires: new Date(0), // expire immediately
//   });

//   return res;
// }

// import { cookies } from 'next/headers';
// import userSchema from '../../../../lib/db/models/User';
// import EmpSchema from '../../../../lib/db/models/payroll/Employee';
// import { connectToDatabase } from '../../../lib/mongodb';

// export async function POST() {
//   try {
//     const cookieStore = cookies();
//     const sessionToken = cookieStore.get('sessionToken')?.value;

//     if (sessionToken) {
//       await connectToDatabase();
//       await userSchema.findOneAndUpdate(
//         {
//           sessionToken
//         },
//         {
//           $unset: {
//             sessionToken: 1
//           }
//         }
//       );
//       await EmpSchema.findOneAndUpdate(
//         {
//           sessionToken
//         },
//         {
//           $unset: {
//             sessionToken: 1
//           }
//         }
//       );

//     }

//     // Clear the session cookie
//     cookieStore.delete('sessionToken');

//     return new Response(JSON.stringify({
//       message: 'Logout successful'
//     }), {
//       status: 200
//     });

//   } catch (error) {
//     console.error('Logout error:', error);
//     return new Response(JSON.stringify({
//       message: 'Logout failed'
//     }), {
//       status: 500
//     });
//   }
// }

// src/app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import User from '@/lib/db/models/User';
import Employee from '@/lib/db/models/payroll/Employee';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    await dbConnect();

    const token = req.cookies.get('authToken')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No session found' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error('Invalid token:', error);
      return NextResponse.json({ message: 'Invalid or expired session' }, { status: 401 });
    }

    const { id, role, department } = decoded;

    if (department === 'admin' && role === 'admin') {
      await User.updateOne({ _id: id }, { $unset: { sessionToken: '' } });
    } else if (role === 'employee') {
      await Employee.updateOne({ _id: id }, { $unset: { sessionToken: '' } });
    }

    const res = NextResponse.json({ message: 'Logged out successfully' });
    res.cookies.set('authToken', '', { maxAge: 0 }); // Clear cookie
    return res;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'Server error: ' + error.message }, { status: 500 });
  }
}