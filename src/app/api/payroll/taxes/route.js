//src/app/api/payroll/taxes/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import TaxCalculation from '@/lib/db/models/payroll/TaxCalculation';
import Employee from '@/lib/db/models/payroll/Employee';
import User from '@/lib/db/models/User';

// GET all tax calculations
export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const financialYear = searchParams.get('financialYear');
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    if (financialYear) filter.financialYear = financialYear;
    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;
    
    const taxCalculations = await TaxCalculation.find(filter)
      .populate({
        path: 'employee',
        select: 'employeeId personalDetails.firstName personalDetails.lastName',
        model: Employee
      })
      .populate({
        path: 'calculatedBy',
        select: 'name email',
        model: User, // Use the imported User model
        options: { lean: true }
      })
      .populate({
        path: 'reviewedBy',
        select: 'name email',
        model: User,
        options: { lean: true }
      })
      .populate({
        path: 'approvedBy',
        select: 'name email',
        model: User,
        options: { lean: true }
      })
      .sort({ financialYear: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await TaxCalculation.countDocuments(filter);
    
    return NextResponse.json({
      taxCalculations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tax calculations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// CREATE new tax calculation
export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Map the new form structure to the expected TaxCalculation model
    const taxCalculationData = {
      employee: body.employee,
      financialYear: body.financialYear,
      
      // Map salary components to totalEarnings
      totalEarnings: (body.basicSalary || 0) + 
                    (body.hra || 0) + 
                    (body.specialAllowance || 0) + 
                    (body.otherAllowances || 0) + 
                    (body.lta || 0),
      
      // Map deductions
      totalDeductions: (body.section80C || 0) + 
                      (body.section80D || 0) + 
                      (body.section80CCD || 0) + 
                      (body.section80E || 0) + 
                      (body.section24 || 0) + 
                      (body.otherDeductions || 0),
      
      // Use calculated values
      taxableIncome: body.calculatedValues?.taxableIncome || 0,
      totalTax: body.calculatedValues?.finalTax || 0,
      
      // Additional fields
      taxRegime: body.taxRegime,
      age: body.age,
      status: body.status || 'Calculated',
      notes: body.notes,
      
      // Include detailed breakdown for reference
      calculationDetails: {
        salaryComponents: {
          basicSalary: body.basicSalary,
          hra: body.hra,
          specialAllowance: body.specialAllowance,
          otherAllowances: body.otherAllowances,
          lta: body.lta
        },
        deductions: {
          section80C: body.section80C,
          section80D: body.section80D,
          section80CCD: body.section80CCD,
          section80E: body.section80E,
          section24: body.section24,
          otherDeductions: body.otherDeductions
        },
        hraDetails: {
          rentPaid: body.rentPaid,
          cityType: body.cityType
        },
        calculatedValues: body.calculatedValues
      },
      
      // For development, ensure we have a calculatedBy value
      calculatedBy: body.calculatedBy || '66e2f79f3b8d2e1f1a9d9c33'
    };
    
    const taxCalculation = await TaxCalculation.create(taxCalculationData);
    
    await taxCalculation.populate({
      path: 'employee',
      select: 'employeeId personalDetails.firstName personalDetails.lastName',
      model: Employee
    });
    
    return NextResponse.json(taxCalculation, { status: 201 });
  } catch (error) {
    console.error('Error creating tax calculation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}