"use client";

import { useState, useEffect } from "react";
import {
  Save,
  X,
  Calculator,
  User,
  Calendar,
  Plus,
  Minus,
  DollarSign,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Bell,
  FileText,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function PayslipGenerator() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [errors, setErrors] = useState({});
  const [duplicatePayslip, setDuplicatePayslip] = useState(null);
  const [formData, setFormData] = useState({
    employee: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
    earnings: [
      { type: "HRA", amount: 0 },
      { type: "TA", amount: 0 },
    ],
    deductions: [
      { type: "PF", amount: 0 },
      { type: "TDS", amount: 0 },
      { type: "Professional Tax", amount: 0 },
    ],
    workingDays: 22,
    presentDays: 22,
    leaveDays: 0,
    overtimeHours: 0,
    overtimeRate: 0,
    notes: "",
  });

  const [calculatedValues, setCalculatedValues] = useState({
    grossSalary: 0,
    totalDeductions: 0,
    netSalary: 0,
    overtimeAmount: 0,
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    calculateValues();
  }, [formData]);

  // Check for duplicate when employee, month, or year changes
  useEffect(() => {
    if (formData.employee && formData.month && formData.year) {
      checkDuplicatePayslip();
    } else {
      setDuplicatePayslip(null);
    }
  }, [formData.employee, formData.month, formData.year]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/payroll/employees");
      const data = await response.json();
      if (response.ok) {
        setEmployees(data.employees || []);
      } else {
        console.error("Failed to fetch employees:", data.error);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

    const fetchEmployeeDetails = async (employeeId) => {
    try {
      const response = await fetch(`/api/payroll/employees/${employeeId}`);
      const data = await response.json();

      console.log(data);
      
      if (response.ok) {
        // Assuming the employee object has salaryDetails with basicSalary, earnings, and deductions
        const { salaryDetails } = data;
        setFormData((prev) => ({
          ...prev,
          basicSalary: salaryDetails?.basicSalary || 0,
          earnings: salaryDetails?.earnings || prev.earnings,
          deductions: salaryDetails?.deductions || prev.deductions,
          overtimeRate: salaryDetails?.overtimeRate || 0
        }));
      } else {
        console.error('Failed to fetch employee details:', data.error);
        setErrors((prev) => ({ ...prev, employee: 'Failed to load employee details' }));
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      setErrors((prev) => ({ ...prev, employee: 'Error fetching employee details' }));
    }
  };

  const checkDuplicatePayslip = async () => {
    if (!formData.employee || !formData.month || !formData.year) return;

    setCheckingDuplicate(true);
    try {
      const response = await fetch(
        `/api/payroll/payslip/check?employee=${formData.employee}&month=${formData.month}&year=${formData.year}`
      );

      if (response.ok) {
        const data = await response.json();
        setDuplicatePayslip(data.exists ? data.payslip : null);
      }
    } catch (error) {
      console.error("Error checking duplicate payslip:", error);
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const calculateValues = () => {
    const grossSalary = formData.earnings.reduce(
      (sum, earning) => sum + (parseFloat(earning.amount) || 0),
      0
    );
    const totalDeductions = formData.deductions.reduce(
      (sum, deduction) => sum + (parseFloat(deduction.amount) || 0),
      0
    );
    const overtimeAmount =
      (parseFloat(formData.overtimeHours) || 0) *
      (parseFloat(formData.overtimeRate) || 0);
    const netSalary = grossSalary - totalDeductions + overtimeAmount;

    setCalculatedValues({
      grossSalary,
      totalDeductions,
      netSalary,
      overtimeAmount,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Days') || name.includes('Hours') || name.includes('Rate') || name === 'basicSalary'
        ? parseFloat(value) || 0 
        : value
    }));

    // Fetch employee details when employee is selected
    if (name === 'employee' && value) {
      fetchEmployeeDetails(value);
    }
  };

  const handleEarningChange = (index, field, value) => {
    const newEarnings = [...formData.earnings];
    newEarnings[index][field] =
      field === "amount" ? parseFloat(value) || 0 : value;

    // Update basic salary if Basic earning type is changed
    if (newEarnings[index].type === "Basic" && field === "amount") {
      setFormData((prev) => ({
        ...prev,
        earnings: newEarnings,
        basicSalary: parseFloat(value) || 0,
      }));
    } else {
      setFormData((prev) => ({ ...prev, earnings: newEarnings }));
    }
  };

  const handleDeductionChange = (index, field, value) => {
    const newDeductions = [...formData.deductions];
    newDeductions[index][field] =
      field === "amount" ? parseFloat(value) || 0 : value;
    setFormData((prev) => ({ ...prev, deductions: newDeductions }));
  };

  const addEarning = () => {
    setFormData((prev) => ({
      ...prev,
      earnings: [...prev.earnings, { type: "Other", amount: 0 }],
    }));
  };

  const removeEarning = (index) => {
    setFormData((prev) => ({
      ...prev,
      earnings: prev.earnings.filter((_, i) => i !== index),
    }));
  };

  const addDeduction = () => {
    setFormData((prev) => ({
      ...prev,
      deductions: [...prev.deductions, { type: "Other", amount: 0 }],
    }));
  };

  const removeDeduction = (index) => {
    setFormData((prev) => ({
      ...prev,
      deductions: prev.deductions.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employee) newErrors.employee = "Please select an employee";
    if (!formData.month) newErrors.month = "Month is required";
    if (!formData.year) newErrors.year = "Year is required";
    if (formData.basicSalary <= 0)
      newErrors.basicSalary = "Basic salary must be greater than 0";
    if (formData.presentDays > formData.workingDays)
      newErrors.presentDays = "Present days cannot exceed working days";
    if (formData.presentDays <= 0)
      newErrors.presentDays = "Present days must be greater than 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Don't block submission due to duplicate - let backend handle it
    // but show warning to user
    if (duplicatePayslip) {
      const confirmOverwrite = window.confirm(
        `A payslip for ${months[formData.month - 1]} ${
          formData.year
        } already exists for this employee. Do you want to create a new one? This will not overwrite the existing payslip.`
      );
      if (!confirmOverwrite) {
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        grossSalary: calculatedValues.grossSalary,
        totalDeductions: calculatedValues.totalDeductions,
        netSalary: calculatedValues.netSalary,
        overtimeAmount: calculatedValues.overtimeAmount,
        status: "Generated",
      };

      const response = await fetch("/api/payroll/payslip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Payslip generated successfully");
        alert("Payslip generated successfully!");
        router.back();
      } else {
        if (data.error === "DUPLICATE_PAYSLIP") {
          setDuplicatePayslip(data.existingPayslipId);
          alert(
            data.message ||
              "A payslip for this employee and period already exists. Please choose a different month/year."
          );
        } else {
          alert(`Error: ${data.error || "Failed to generate payslip"}`);
        }
      }
    } catch (error) {
      console.error("Error generating payslip:", error);
      alert("An error occurred while generating the payslip");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const selectedEmployee = employees.find(
    (emp) => emp._id === formData.employee
  );

  const getFormProgress = () => {
    const requiredFields = [
      formData.employee,
      formData.month,
      formData.year,
      formData.basicSalary > 0,
      formData.presentDays > 0 && formData.presentDays <= formData.workingDays,
    ];

    const completedFields = requiredFields.filter((field) => field).length;
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  const progress = getFormProgress();

  const earningTypes = [
    "Basic",
    "HRA",
    "TA",
    "DA",
    "Special Allowance",
    "Bonus",
    "Overtime",
    "Other",
  ];
  const deductionTypes = [
    "PF",
    "TDS",
    "Professional Tax",
    "ESI",
    "Loan",
    "Advance",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Payslip Generator
                </h1>
                <p className="text-slate-600 text-sm mt-0.5">
                  Create accurate payslips for employee salary processing
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Indicator */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Generation Progress
            </h3>
            <span className="text-sm font-medium text-slate-600">
              {progress}% Complete
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div
              className={`flex items-center space-x-2 ${
                formData.employee ? "text-green-700" : "text-slate-500"
              }`}
            >
              {formData.employee ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
              )}
              <span>Employee Selected</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                formData.basicSalary > 0 ? "text-green-700" : "text-slate-500"
              }`}
            >
              {formData.basicSalary > 0 ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
              )}
              <span>Basic Salary Set</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                calculatedValues.grossSalary > 0
                  ? "text-green-700"
                  : "text-slate-500"
              }`}
            >
              {calculatedValues.grossSalary > 0 ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
              )}
              <span>Earnings Added</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                calculatedValues.netSalary > 0
                  ? "text-green-700"
                  : "text-slate-500"
              }`}
            >
              {calculatedValues.netSalary > 0 ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
              )}
              <span>Ready to Generate</span>
            </div>
          </div>

          {/* Duplicate Payslip Warning */}
          {duplicatePayslip && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800">
                    Existing Payslip Found
                  </h4>
                  <p className="text-yellow-700 text-sm mt-1">
                    A payslip for {months[formData.month - 1]} {formData.year}{" "}
                    already exists for this employee. You can still create a new
                    payslip, but consider using a different month/year to avoid
                    duplicates.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Employee Details Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Employee Selection */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                    <User className="w-4 h-4 text-yellow-600" />
                  </div>
                  Employee Selection
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Choose employee and pay period
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Select Employee <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="employee"
                    value={formData.employee}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white ${
                      errors.employee
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-300"
                    }`}
                  >
                    <option value="">Choose an employee...</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.employeeId} - {emp.personalDetails?.firstName}{" "}
                        {emp.personalDetails?.lastName}
                      </option>
                    ))}
                  </select>
                  {errors.employee && (
                    <div className="flex items-center space-x-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.employee}</span>
                    </div>
                  )}
                </div>

                {checkingDuplicate && (
                  <div className="flex items-center space-x-2 text-blue-600 text-sm">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Checking for existing payslips...</span>
                  </div>
                )}

                {selectedEmployee && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {selectedEmployee.personalDetails?.firstName}{" "}
                          {selectedEmployee.personalDetails?.lastName}
                        </div>
                        <div className="text-sm text-slate-600">
                          {selectedEmployee.jobDetails?.department}
                        </div>
                        <div className="text-xs text-slate-500">
                          ID: {selectedEmployee.employeeId}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Month <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="month"
                      value={formData.month}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
                    >
                      {months.map((month, index) => (
                        <option key={month} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="year"
                      type="number"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Salary Summary */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  Salary Summary
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Gross Salary:</span>
                  <span className="font-semibold text-slate-900">
                    ${calculatedValues.grossSalary.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Total Deductions:</span>
                  <span className="font-semibold text-red-600">
                    -${calculatedValues.totalDeductions.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Overtime Amount:</span>
                  <span className="font-semibold text-green-600">
                    +${calculatedValues.overtimeAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                  <span className="text-lg font-bold text-slate-900">
                    Net Salary:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    ${calculatedValues.netSalary.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form Content */}
          <div className="xl:col-span-3 space-y-8">
            {/* Basic Salary & Attendance Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  </div>
                  Basic Salary & Attendance
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Set basic salary and attendance details
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Basic Salary <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      name="basicSalary"
                      type="number"
                      value={formData.basicSalary}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                        errors.basicSalary
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                  </div>
                  {errors.basicSalary && (
                    <div className="flex items-center space-x-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.basicSalary}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Working Days
                    </label>
                    <input
                      name="workingDays"
                      type="number"
                      value={formData.workingDays}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Present Days
                    </label>
                    <input
                      name="presentDays"
                      type="number"
                      value={formData.presentDays}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                        errors.presentDays
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Leave Days
                    </label>
                    <input
                      name="leaveDays"
                      type="number"
                      value={formData.leaveDays}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    />
                  </div>
                </div>

                {errors.presentDays && (
                  <div className="flex items-center space-x-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.presentDays}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Overtime Hours
                    </label>
                    <input
                      name="overtimeHours"
                      type="number"
                      value={formData.overtimeHours}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Overtime Rate
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        name="overtimeRate"
                        type="number"
                        value={formData.overtimeRate}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  Earnings & Allowances
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Add all earnings and allowances for this pay period
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {formData.earnings.map((earning, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1">
                        <select
                          value={earning.type}
                          onChange={(e) =>
                            handleEarningChange(index, "type", e.target.value)
                          }
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
                        >
                          {earningTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 relative">
                        <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="number"
                          value={earning.amount}
                          onChange={(e) =>
                            handleEarningChange(index, "amount", e.target.value)
                          }
                          className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                        />
                      </div>
                      {formData.earnings.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEarning(index)}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addEarning}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Earning
                  </button>
                </div>
              </div>
            </div>

            {/* Deductions Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                    <TrendingUp className="w-4 h-4 text-red-600 transform rotate-180" />
                  </div>
                  Deductions
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Add all deductions for this pay period
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {formData.deductions.map((deduction, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1">
                        <select
                          value={deduction.type}
                          onChange={(e) =>
                            handleDeductionChange(index, "type", e.target.value)
                          }
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
                        >
                          {deductionTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 relative">
                        <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="number"
                          value={deduction.amount}
                          onChange={(e) =>
                            handleDeductionChange(
                              index,
                              "amount",
                              e.target.value
                            )
                          }
                          className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                        />
                      </div>
                      {formData.deductions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDeduction(index)}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addDeduction}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Deduction
                  </button>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  Additional Notes
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Add any additional notes or comments for this payslip
                </p>
              </div>

              <div className="p-6">
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none"
                  placeholder="Add any notes, comments, or special instructions for this payslip..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-6 py-3 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Generate Payslip
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}