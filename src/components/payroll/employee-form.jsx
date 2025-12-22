"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Briefcase,
  CreditCard,
  Save,
  X,
  Truck,
  Warehouse,
  Package,
  BarChart3,
  Settings,
  Bell,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Upload,
  FileText,
  DollarSign,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Validation utilities
const validators = {
  // Alphabets + spaces only (1-40 chars)
  name: (v) => /^[A-Za-z\s]{1,40}$/.test(v?.trim() || ''),
  
  // Email (RFC-like)
  email: (v) => /^\S+@\S+\.\S+$/.test(v || ''),
  
  // Indian mobile – 10 digits starting with 6-9
  phone: (v) => /^[6-9]\d{9}$/.test(v?.replace(/\D/g, '') || ''),
  
  // Positive integer (for basic salary)
  positiveNumber: (v) => /^\d+$/.test(v) && parseInt(v) > 0,
  
  // Account number – 9-18 digits
  accountNumber: (v) => /^\d{9,18}$/.test(v),
  
  // IFSC – 4 letters + 0 + 6 alphanum
  ifsc: (v) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test((v || '').toUpperCase()),
  
  // PAN – 5 letters + 4 digits + 1 letter
  pan: (v) => /^[A-Z]{5}\d{4}[A-Z]$/.test((v || '').toUpperCase()),
  
  // Aadhar – exactly 12 digits
  aadhar: (v) => /^\d{12}$/.test(v),
  
  // ZIP – 6 digits
  zip: (v) => !v || /^\d{6}$/.test(v),
};

// Helper function to format phone number for display
const formatPhoneNumber = (value) => {
  const phone = value.replace(/\D/g, '');
  if (phone.length <= 3) return phone;
  if (phone.length <= 7) return `${phone.slice(0, 3)} ${phone.slice(3)}`;
  return `${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7, 10)}`;
};

// Helper function to format PAN number
const formatPanNumber = (value) => {
  const pan = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (pan.length <= 5) return pan;
  if (pan.length <= 9) return `${pan.slice(0, 5)}${pan.slice(5)}`;
  return `${pan.slice(0, 5)}${pan.slice(5, 9)}${pan.slice(9, 10)}`;
};

// Helper function to format Aadhar number
const formatAadharNumber = (value) => {
  const aadhar = value.replace(/\D/g, '');
  if (aadhar.length <= 4) return aadhar;
  if (aadhar.length <= 8) return `${aadhar.slice(0, 4)} ${aadhar.slice(4)}`;
  return `${aadhar.slice(0, 4)} ${aadhar.slice(4, 8)} ${aadhar.slice(8, 12)}`;
};

// Simple select component for form
function SimpleSelect({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  error,
}) {
  return (
    <div>
      <select
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white ${
          error
            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
            : "border-slate-300"
        } ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="flex items-center space-x-1 text-red-600 text-xs mt-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default function EmployeeForm({ employeeData, isEdit = false }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    employeeId: "",
    personalDetails: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
      },
      dateOfJoining: "",
      dateOfBirth: "",
      gender: "",
    },
    jobDetails: {
      department: "",
      designation: "",
      employmentType: "Full-Time",
      workLocation: "",
    },
    salaryDetails: {
      basicSalary: "",
      allowances: [],
      deductions: [],
      bankAccount: {
        accountNumber: "",
        bankName: "",
        ifscCode: "",
        branch: "",
      },
      panNumber: "",
      aadharNumber: "",
    },
    status: "Active",
  });

  // Updated department options to match LoginPage roles
  const departmentOptions = [
     { value: 'odt', label: 'Operations & Data Team' },
    { value: 'art', label: 'Analysis & Reporting Team' },
    { value: 'scm', label: 'Supply Chain Management' },
    { value: 'acc', label: 'Accounts & Finance' },
  ];

  const designationOptions = [
    { value: "Employee", label: "Employee" },
    { value: "Supervisor", label: "Supervisor" },
  ];

  const employmentTypeOptions = [
    { value: "Full-Time", label: "Full-Time Employee" },
    { value: "Part-Time", label: "Part-Time Employee" },
    { value: "Contract", label: "Contract Worker" },
    { value: "Intern", label: "Intern/Trainee" },
  ];

  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Suspended", label: "Suspended" },
    { value: "Terminated", label: "Terminated" },
  ];

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];

  useEffect(() => {
    if (employeeData && isEdit) {
      setFormData(employeeData);
    }
  }, [employeeData, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    let formattedValue = value;

    // Format phone number
    if (name === "personalDetails.phone") {
      formattedValue = formatPhoneNumber(value);
    }

    // Format PAN number
    if (name === "salaryDetails.panNumber") {
      formattedValue = formatPanNumber(value);
    }

    // Format Aadhar number
    if (name === "salaryDetails.aadharNumber") {
      formattedValue = formatAadharNumber(value);
    }

    if (name.includes(".")) {
      const [parent, child, subChild] = name.split(".");

      if (subChild) {
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: formattedValue,
            },
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: formattedValue,
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
    }
  };

  const handleSelectChange = (field, value) => {
    // Clear error when user makes selection
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    setFormData((prev) => {
      const newData = { ...prev };
      const fields = field.split(".");

      if (fields.length === 1) {
        newData[fields[0]] = value;
      } else if (fields.length === 2) {
        newData[fields[0]][fields[1]] = value;
      } else if (fields.length === 3) {
        newData[fields[0]][fields[1]][fields[2]] = value;
      }

      return newData;
    });
  };

const validateForm = () => {
  const newErrors = {};

  // Required field validation
  if (!formData.employeeId) newErrors.employeeId = "Employee ID is required";
  
  // Personal Details Validation
  if (!formData.personalDetails.firstName) {
    newErrors["personalDetails.firstName"] = "First name is required";
  } else if (!validators.name(formData.personalDetails.firstName)) {
    newErrors["personalDetails.firstName"] = "First name should contain only alphabets and spaces (1-40 characters)";
  }

  if (!formData.personalDetails.lastName) {
    newErrors["personalDetails.lastName"] = "Last name is required";
  } else if (!validators.name(formData.personalDetails.lastName)) {
    newErrors["personalDetails.lastName"] = "Last name should contain only alphabets and spaces (1-40 characters)";
  }

  if (!formData.personalDetails.email) {
    newErrors["personalDetails.email"] = "Email is required";
  } else if (!validators.email(formData.personalDetails.email)) {
    newErrors["personalDetails.email"] = "Please enter a valid email address";
  }

  if (!formData.personalDetails.phone) {
    newErrors["personalDetails.phone"] = "Phone number is required";
  } else if (!validators.phone(formData.personalDetails.phone)) {
    newErrors["personalDetails.phone"] = "Please enter a valid 10-digit Indian phone number starting with 6-9";
  }

  if (!formData.personalDetails.dateOfJoining) {
    newErrors["personalDetails.dateOfJoining"] = "Date of joining is required";
  }

  // Job Details Validation
  if (!formData.jobDetails.department) {
    newErrors["jobDetails.department"] = "Department is required";
  }
  if (!formData.jobDetails.designation) {
    newErrors["jobDetails.designation"] = "Designation is required";
  }

  // Salary Details Validation
  if (!formData.salaryDetails.basicSalary) {
    newErrors["salaryDetails.basicSalary"] = "Basic salary is required";
  } else if (!validators.positiveNumber(formData.salaryDetails.basicSalary)) {
    newErrors["salaryDetails.basicSalary"] = "Basic salary must be a positive number";
  }

  // Bank Account Validation
  if (!formData.salaryDetails.bankAccount.accountNumber) {
    newErrors["salaryDetails.bankAccount.accountNumber"] = "Account number is required";
  } else if (!validators.accountNumber(formData.salaryDetails.bankAccount.accountNumber)) {
    newErrors["salaryDetails.bankAccount.accountNumber"] = "Account number must be 9-18 digits";
  }

  if (!formData.salaryDetails.bankAccount.bankName) {
    newErrors["salaryDetails.bankAccount.bankName"] = "Bank name is required";
  }

  if (!formData.salaryDetails.bankAccount.ifscCode) {
    newErrors["salaryDetails.bankAccount.ifscCode"] = "IFSC code is required";
  }

  console.log(formData.salaryDetails.aadharNumber);
  
const cleanedAadhar = formData.salaryDetails.aadharNumber?.replace(/\s/g, '') || '';

console.log(cleanedAadhar);


if (!formData.salaryDetails.aadharNumber) {
  newErrors["salaryDetails.aadharNumber"] = "Aadhar Number is required";
} else if (!validators.aadhar(cleanedAadhar)) {
  newErrors["salaryDetails.aadharNumber"] = "Please enter a valid 12-digit Aadhar number";
}

  // PAN Number Validation (if provided)
  // if (formData.salaryDetails.panNumber) {
  //   newErrors["salaryDetails.panNumber"] = "Please enter a valid PAN number (e.g., ABCDE1234F)";
  // }

  // ZIP Code Validation (if provided)
  if (formData.personalDetails.address.zipCode && !validators.zip(formData.personalDetails.address.zipCode)) {
    newErrors["personalDetails.address.zipCode"] = "Please enter a valid 6-digit ZIP code";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const url = isEdit
        ? `/api/payroll/employees/${employeeData._id}`
        : "/api/payroll/employees";

      const method = isEdit ? "PUT" : "POST";

      // Clean phone number before sending (remove spaces)
      const submitData = {
      ...formData,
      personalDetails: {
        ...formData.personalDetails,
        phone: formData.personalDetails.phone.replace(/\s/g, ''),
      },
      salaryDetails: {
        ...formData.salaryDetails,
        panNumber: formData.salaryDetails.panNumber.replace(/\s/g, '').toUpperCase(),
        aadharNumber: formData.salaryDetails.aadharNumber.replace(/\s/g, ''), // Clean Aadhar spaces
        bankAccount: {
          ...formData.salaryDetails.bankAccount,
          ifscCode: formData.salaryDetails.bankAccount.ifscCode.toUpperCase(),
        }
      }
    };

    console.log(submitData);
    
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        console.log("Employee saved successfully");
        alert(`Employee ${isEdit ? "updated" : "created"} successfully!`);
        router.back();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error saving employee:", error);
      alert("An error occurred while saving the employee");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const getFormProgress = () => {
    const requiredFields = [
      formData.employeeId,
      formData.personalDetails.firstName,
      formData.personalDetails.lastName,
      formData.personalDetails.email,
      formData.personalDetails.phone,
      formData.personalDetails.dateOfJoining,
      formData.jobDetails.department,
      formData.jobDetails.designation,
      formData.salaryDetails.basicSalary,
      formData.salaryDetails.bankAccount.accountNumber,
    ];

    const completedFields = requiredFields.filter(
      (field) => field && field.toString().trim() !== ""
    ).length;
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  const progress = getFormProgress();

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
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {isEdit ? "Edit Employee Profile" : "Add New Employee"}
                </h1>
                <p className="text-slate-600 text-sm mt-0.5">
                  {isEdit
                    ? "Update employee information and details"
                    : "Create a new employee profile for your supply chain team"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
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
              Form Completion
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
            <div
              className={`flex items-center space-x-2 ${
                formData.personalDetails.firstName && validators.name(formData.personalDetails.firstName)
                  ? "text-green-700"
                  : "text-slate-500"
              }`}
            >
              {formData.personalDetails.firstName && validators.name(formData.personalDetails.firstName) ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
              )}
              <span>Personal Information</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                formData.jobDetails.department
                  ? "text-green-700"
                  : "text-slate-500"
              }`}
            >
              {formData.jobDetails.department ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
              )}
              <span>Job Details</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                formData.salaryDetails.basicSalary && validators.positiveNumber(formData.salaryDetails.basicSalary)
                  ? "text-green-700"
                  : "text-slate-500"
              }`}
            >
              {formData.salaryDetails.basicSalary && validators.positiveNumber(formData.salaryDetails.basicSalary) ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
              )}
              <span>Financial Information</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Personal Details Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                    <User className="w-4 h-4 text-yellow-600" />
                  </div>
                  Personal Information
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Basic employee details and contact information
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Employee ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      disabled={isEdit}
                      placeholder="EMP001"
                      maxLength={10}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                        isEdit ? "bg-slate-100 cursor-not-allowed" : "bg-white"
                      } ${
                        errors.employeeId
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                    {errors.employeeId && (
                      <div className="flex items-center space-x-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.employeeId}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Date of Joining <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        name="personalDetails.dateOfJoining"
                        type="date"
                        value={formData.personalDetails.dateOfJoining}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                          errors["personalDetails.dateOfJoining"]
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-slate-300"
                        }`}
                      />
                    </div>
                    {errors["personalDetails.dateOfJoining"] && (
                      <div className="flex items-center space-x-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors["personalDetails.dateOfJoining"]}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="personalDetails.firstName"
                      value={formData.personalDetails.firstName}
                      onChange={handleChange}
                      maxLength={40}
                      placeholder="John"
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                        errors["personalDetails.firstName"]
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                    {errors["personalDetails.firstName"] && (
                      <div className="flex items-center space-x-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors["personalDetails.firstName"]}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="personalDetails.lastName"
                      value={formData.personalDetails.lastName}
                      onChange={handleChange}
                      maxLength={40}
                      placeholder="Doe"
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                        errors["personalDetails.lastName"]
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                    {errors["personalDetails.lastName"] && (
                      <div className="flex items-center space-x-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors["personalDetails.lastName"]}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="personalDetails.email"
                      type="email"
                      value={formData.personalDetails.email}
                      onChange={handleChange}
                      maxLength={40}
                      placeholder="john.doe@company.com"
                      className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                        errors["personalDetails.email"]
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                  </div>
                  {errors["personalDetails.email"] && (
                    <div className="flex items-center space-x-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors["personalDetails.email"]}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="personalDetails.phone"
                      type="tel"
                      value={formData.personalDetails.phone}
                      onChange={handleChange}
                      placeholder="987 654 3210"
                      className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                        errors["personalDetails.phone"]
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                  </div>
                  {errors["personalDetails.phone"] && (
                    <div className="flex items-center space-x-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors["personalDetails.phone"]}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        name="personalDetails.dateOfBirth"
                        type="date"
                        value={formData.personalDetails.dateOfBirth}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Gender
                    </label>
                    <SimpleSelect
                      value={formData.personalDetails.gender}
                      onChange={(e) =>
                        handleSelectChange(
                          "personalDetails.gender",
                          e.target.value
                        )
                      }
                      options={genderOptions}
                      placeholder="Select gender"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  </div>
                  Job Information
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Employment details and organizational structure
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <SimpleSelect
                    value={formData.jobDetails.department}
                    onChange={(e) =>
                      handleSelectChange(
                        "jobDetails.department",
                        e.target.value
                      )
                    }
                    options={departmentOptions}
                    placeholder="Select department"
                    error={errors["jobDetails.department"]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <SimpleSelect
                    value={formData.jobDetails.designation}
                    onChange={(e) =>
                      handleSelectChange(
                        "jobDetails.designation",
                        e.target.value
                      )
                    }
                    options={designationOptions}
                    placeholder="Select designation"
                    error={errors["jobDetails.designation"]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Employment Type <span className="text-red-500">*</span>
                  </label>
                  <SimpleSelect
                    value={formData.jobDetails.employmentType}
                    onChange={(e) =>
                      handleSelectChange(
                        "jobDetails.employmentType",
                        e.target.value
                      )
                    }
                    options={employmentTypeOptions}
                    placeholder="Select employment type"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Work Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="jobDetails.workLocation"
                      value={formData.jobDetails.workLocation}
                      onChange={handleChange}
                      placeholder="Mumbai, India"
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Employee Status <span className="text-red-500">*</span>
                  </label>
                  <SimpleSelect
                    value={formData.status}
                    onChange={(e) =>
                      handleSelectChange("status", e.target.value)
                    }
                    options={statusOptions}
                    placeholder="Select status"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Salary & Bank Details Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                  <CreditCard className="w-4 h-4 text-green-600" />
                </div>
                Financial Information
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Salary details, bank account information, and compliance data
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Basic Salary (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="salaryDetails.basicSalary"
                      type="number"
                      value={formData.salaryDetails.basicSalary}
                      onChange={handleChange}
                      placeholder="50000"
                      maxLength={16}
                      className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                        errors["salaryDetails.basicSalary"]
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                  </div>
                  {errors["salaryDetails.basicSalary"] && (
                    <div className="flex items-center space-x-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors["salaryDetails.basicSalary"]}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    PAN Number
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="salaryDetails.panNumber"
                      value={formData.salaryDetails.panNumber}
                      onChange={handleChange}
                      placeholder="ABCDE 1234 F"
                      className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                        errors["salaryDetails.panNumber"]
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                  </div>
                  {errors["salaryDetails.panNumber"] && (
                    <div className="flex items-center space-x-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors["salaryDetails.panNumber"]}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Bank Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="salaryDetails.bankAccount.accountNumber"
                    value={formData.salaryDetails.bankAccount.accountNumber}
                    onChange={handleChange}
                    maxLength={20}
                    placeholder="123456789012"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                      errors["salaryDetails.bankAccount.accountNumber"]
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-300"
                    }`}
                  />
                  {errors["salaryDetails.bankAccount.accountNumber"] && (
                    <div className="flex items-center space-x-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>
                        {errors["salaryDetails.bankAccount.accountNumber"]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="salaryDetails.bankAccount.bankName"
                    value={formData.salaryDetails.bankAccount.bankName}
                    onChange={handleChange}
                    placeholder="State Bank of India"
                    maxLength={40}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                      errors["salaryDetails.bankAccount.bankName"]
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-300"
                    }`}
                  />
                  {errors["salaryDetails.bankAccount.bankName"] && (
                    <div className="flex items-center space-x-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>
                        {errors["salaryDetails.bankAccount.bankName"]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="salaryDetails.bankAccount.ifscCode"
                    value={formData.salaryDetails.bankAccount.ifscCode}
                    onChange={handleChange}
                    placeholder="SBIN0001234"
                    maxLength={11}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                      errors["salaryDetails.bankAccount.ifscCode"]
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-300"
                    }`}
                  />
                  {errors["salaryDetails.bankAccount.ifscCode"] && (
                    <div className="flex items-center space-x-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>
                        {errors["salaryDetails.bankAccount.ifscCode"]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Branch Name
                  </label>
                  <input
                    name="salaryDetails.bankAccount.branch"
                    value={formData.salaryDetails.bankAccount.branch}
                    onChange={handleChange}
                    maxLength={30}
                    placeholder="Mumbai Central Branch"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Aadhar Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="salaryDetails.aadharNumber"
                  value={formData.salaryDetails.aadharNumber}
                  onChange={handleChange}
                  placeholder="1234 5678 9012"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                    errors["salaryDetails.aadharNumber"]
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300"
                  }`}
                />
                {errors["salaryDetails.aadharNumber"] && (
                  <div className="flex items-center space-x-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors["salaryDetails.aadharNumber"]}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-8">
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
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? "Update Employee" : "Create Employee"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
