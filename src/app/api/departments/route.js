import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Department from '@/lib/db/models/Department';

export async function GET() {
  try {
    await dbConnect();
    const depts = await Department.find({ status: 'Active' }).lean();
    
    // Create a mapping for easy lookup in frontend
    // { "696...": "ODT", ... }
    const mapping = {};
    depts.forEach(d => {
      mapping[d._id.toString()] = d.departmentName;
    });

    return NextResponse.json({ 
      success: true, 
      departments: depts,
      mapping 
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
