// "use client";

// import { useState, useEffect } from "react";
// import {
//   Save,
//   X,
//   User,
//   Mail,
//   Phone,
//   MapPin,
//   Calendar,
//   Building,
//   Briefcase,
//   CreditCard,
//   Bank,
//   IdCard,
//   AlertCircle,
//   CheckCircle,
//   ArrowLeft,
//   Loader2,
//   Edit3,
//   Landmark,
//   ReceiptIndianRupee,
// } from "lucide-react";

// export default function EmployeeEdit({ employeeId }) {
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [formData, setFormData] = useState({
//     employeeId: "",
//     personalDetails: {
//       firstName: "",
//       lastName: "",
//       email: "",
//       phone: "",
//       address: {
//         street: "",
//         city: "",
//         state: "",
//         zipCode: "",
//       },
//       dateOfJoining: "",
//       dateOfBirth: "",
//       gender: "",
//     },
//     jobDetails: {
//       department: "",
//       designation: "",
//       employmentType: "Full-Time",
//       workLocation: "",
//     },
//     salaryDetails: {
//       basicSalary: "",
//       allowances: [],
//       deductions: [],
//       bankAccount: {
//         accountNumber: "",
//         bankName: "",
//         ifscCode: "",
//         branch: "",
//       },
//       panNumber: "",
//       aadharNumber: "",
//     },
//     status: "Active",
//   });

//   useEffect(() => {
//     if (employeeId) {
//       fetchEmployee();
//     }
//   }, [employeeId]);

//   const fetchEmployee = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`/api/payroll/employees/${employeeId}`);

//       if (response.ok) {
//         const employeeData = await response.json();
//         // Format dates for input fields
//         if (employeeData.personalDetails.dateOfJoining) {
//           employeeData.personalDetails.dateOfJoining = new Date(
//             employeeData.personalDetails.dateOfJoining
//           )
//             .toISOString()
//             .split("T")[0];
//         }
//         if (employeeData.personalDetails.dateOfBirth) {
//           employeeData.personalDetails.dateOfBirth = new Date(
//             employeeData.personalDetails.dateOfBirth
//           )
//             .toISOString()
//             .split("T")[0];
//         }
//         setFormData(employeeData);
//       } else {
//         console.error("Failed to fetch employee:", await response.json());
//         alert("Failed to load employee data");
//       }
//     } catch (error) {
//       console.error("Error fetching employee:", error);
//       alert("Error loading employee data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     // Required field validation
//     if (!formData.employeeId) newErrors.employeeId = "Employee ID is required";
//     if (!formData.personalDetails.firstName)
//       newErrors.firstName = "First name is required";
//     if (!formData.personalDetails.lastName)
//       newErrors.lastName = "Last name is required";
//     if (!formData.personalDetails.email) newErrors.email = "Email is required";
//     if (!formData.personalDetails.phone)
//       newErrors.phone = "Phone number is required";
//     if (!formData.personalDetails.dateOfJoining)
//       newErrors.dateOfJoining = "Date of joining is required";
//     if (!formData.jobDetails.department)
//       newErrors.department = "Department is required";
//     if (!formData.jobDetails.designation)
//       newErrors.designation = "Designation is required";
//     if (!formData.salaryDetails.basicSalary)
//       newErrors.basicSalary = "Basic salary is required";
//     if (!formData.salaryDetails.bankAccount.accountNumber)
//       newErrors.accountNumber = "Account number is required";
//     if (!formData.salaryDetails.bankAccount.bankName)
//       newErrors.bankName = "Bank name is required";
//     if (!formData.salaryDetails.bankAccount.ifscCode)
//       newErrors.ifscCode = "IFSC code is required";

//     // Email validation
//     if (
//       formData.personalDetails.email &&
//       !/\S+@\S+\.\S+/.test(formData.personalDetails.email)
//     ) {
//       newErrors.email = "Email is invalid";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     if (name.includes(".")) {
//       const [parent, child, subChild] = name.split(".");

//       if (subChild) {
//         setFormData((prev) => ({
//           ...prev,
//           [parent]: {
//             ...prev[parent],
//             [child]: {
//               ...prev[parent][child],
//               [subChild]: value,
//             },
//           },
//         }));
//       } else {
//         setFormData((prev) => ({
//           ...prev,
//           [parent]: {
//             ...prev[parent],
//             [child]: value,
//           },
//         }));
//       }
//     } else {
//       setFormData((prev) => ({
//         ...prev,
//         [name]: value,
//       }));
//     }

//     // Clear error when field is updated
//     if (errors[name] || errors[name.split(".").pop()]) {
//       const errorKey = name.split(".").pop();
//       setErrors((prev) => ({ ...prev, [errorKey]: "" }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!validateForm()) {
//       return;
//     }

//     setSaving(true);
//     try {
//       const response = await fetch(`/api/payroll/employees/${employeeId}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(formData),
//       });

//       if (response.ok) {
//         alert("Employee updated successfully!");
//         window.location.href = `/payroll/employees/${employeeId}`;
//       } else {
//         const data = await response.json();
//         alert(`Error: ${data.error}`);
//       }
//     } catch (error) {
//       console.error("Error updating employee:", error);
//       alert("An error occurred while updating the employee");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const departmentOptions = [
//     { value: "odt", label: "Operations & Data Team" },
//     { value: "art", label: "Analysis & Reporting Team" },
//     { value: "scm", label: "Supply Chain Management" },
//     { value: "acc", label: "Accounts & Finance" },
//   ];
//   const designationOptions = [
//     { value: "Employee", label: "Employee" },
//     { value: "Supervisor", label: "Supervisor" },
//   ];

//   const employmentTypeOptions = [
//     "Full-Time",
//     "Part-Time",
//     "Contract",
//     "Intern",
//   ];

//   const statusOptions = ["Active", "Inactive", "Suspended", "Terminated"];

//   const genderOptions = ["Male", "Female", "Other"];

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center">
//         <div className="flex items-center space-x-3">
//           <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
//           <span className="text-slate-600 font-medium">
//             Loading employee data...
//           </span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50">
//       <div className="max-w-7xl mx-auto px-6 py-8">
//         {/* Header */}
//         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
//             <div className="flex items-center gap-4">
//               <button
//                 onClick={() => window.history.back()}
//                 className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
//               >
//                 <ArrowLeft className="w-5 h-5" />
//               </button>

//               <div className="flex items-center gap-4">
//                 <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
//                   <Edit3 className="w-8 h-8 text-white" />
//                 </div>
//                 <div>
//                   <h1 className="text-2xl font-bold text-slate-900 mb-1">
//                     Edit Employee
//                   </h1>
//                   <p className="text-slate-600">
//                     Update employee information and details
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <button
//               onClick={() => window.history.back()}
//               className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
//             >
//               <X className="w-4 h-4" />
//               Cancel
//             </button>
//           </div>
//         </div>

//         {/* Form */}
//         <div className="space-y-8">
//           {/* Personal Details */}
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
//             <div className="p-6 border-b border-slate-200">
//               <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
//                 <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
//                   <User className="w-4 h-4 text-blue-600" />
//                 </div>
//                 Personal Information
//               </h2>
//               <p className="text-slate-600 text-sm mt-1">
//                 Employee's personal information and contact details
//               </p>
//             </div>

//             <div className="p-6 space-y-6">
//               {/* Employee ID and Date of Joining */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label
//                     htmlFor="employeeId"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     Employee ID <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     id="employeeId"
//                     name="employeeId"
//                     value={formData.employeeId}
//                     onChange={handleChange}
//                     disabled
//                     className={`w-full px-4 py-3 border rounded-lg text-sm bg-slate-50 cursor-not-allowed transition-colors ${
//                       errors.employeeId ? "border-red-300" : "border-slate-300"
//                     }`}
//                   />
//                   {errors.employeeId && (
//                     <div className="flex items-center space-x-1 text-red-600 text-sm">
//                       <AlertCircle className="w-4 h-4" />
//                       <span>{errors.employeeId}</span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <label
//                     htmlFor="dateOfJoining"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     Date of Joining <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
//                     <input
//                       id="dateOfJoining"
//                       name="personalDetails.dateOfJoining"
//                       type="date"
//                       value={formData.personalDetails.dateOfJoining}
//                       onChange={handleChange}
//                       className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
//                         errors.dateOfJoining
//                           ? "border-red-300 focus:ring-red-500 focus:border-red-500"
//                           : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
//                       }`}
//                     />
//                   </div>
//                   {errors.dateOfJoining && (
//                     <div className="flex items-center space-x-1 text-red-600 text-sm">
//                       <AlertCircle className="w-4 h-4" />
//                       <span>{errors.dateOfJoining}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Name Fields */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label
//                     htmlFor="firstName"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     First Name <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     id="firstName"
//                     name="personalDetails.firstName"
//                     value={formData.personalDetails.firstName}
//                     onChange={handleChange}
//                     className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
//                       errors.firstName
//                         ? "border-red-300 focus:ring-red-500 focus:border-red-500"
//                         : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
//                     }`}
//                     placeholder="Enter first name"
//                   />
//                   {errors.firstName && (
//                     <div className="flex items-center space-x-1 text-red-600 text-sm">
//                       <AlertCircle className="w-4 h-4" />
//                       <span>{errors.firstName}</span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <label
//                     htmlFor="lastName"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     Last Name <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     id="lastName"
//                     name="personalDetails.lastName"
//                     value={formData.personalDetails.lastName}
//                     onChange={handleChange}
//                     className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
//                       errors.lastName
//                         ? "border-red-300 focus:ring-red-500 focus:border-red-500"
//                         : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
//                     }`}
//                     placeholder="Enter last name"
//                   />
//                   {errors.lastName && (
//                     <div className="flex items-center space-x-1 text-red-600 text-sm">
//                       <AlertCircle className="w-4 h-4" />
//                       <span>{errors.lastName}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Contact Information */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label
//                     htmlFor="email"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     Email <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
//                     <input
//                       id="email"
//                       name="personalDetails.email"
//                       type="email"
//                       value={formData.personalDetails.email}
//                       onChange={handleChange}
//                       className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
//                         errors.email
//                           ? "border-red-300 focus:ring-red-500 focus:border-red-500"
//                           : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
//                       }`}
//                       placeholder="Enter email address"
//                     />
//                   </div>
//                   {errors.email && (
//                     <div className="flex items-center space-x-1 text-red-600 text-sm">
//                       <AlertCircle className="w-4 h-4" />
//                       <span>{errors.email}</span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <label
//                     htmlFor="phone"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     Phone <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
//                     <input
//                       id="phone"
//                       name="personalDetails.phone"
//                       type="tel"
//                       value={formData.personalDetails.phone}
//                       onChange={handleChange}
//                       className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
//                         errors.phone
//                           ? "border-red-300 focus:ring-red-500 focus:border-red-500"
//                           : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
//                       }`}
//                       placeholder="Enter phone number"
//                     />
//                   </div>
//                   {errors.phone && (
//                     <div className="flex items-center space-x-1 text-red-600 text-sm">
//                       <AlertCircle className="w-4 h-4" />
//                       <span>{errors.phone}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Date of Birth and Gender */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label
//                     htmlFor="dateOfBirth"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     Date of Birth
//                   </label>
//                   <div className="relative">
//                     <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
//                     <input
//                       id="dateOfBirth"
//                       name="personalDetails.dateOfBirth"
//                       type="date"
//                       value={formData.personalDetails.dateOfBirth}
//                       onChange={handleChange}
//                       className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <label
//                     htmlFor="gender"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     Gender
//                   </label>
//                   <select
//                     id="gender"
//                     name="personalDetails.gender"
//                     value={formData.personalDetails.gender}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white transition-colors"
//                   >
//                     <option value="">Select gender</option>
//                     {genderOptions.map((option) => (
//                       <option key={option} value={option}>
//                         {option}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               {/* Address */}
//               <div className="space-y-4 pt-4 border-t border-slate-200">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   Address
//                 </label>
//                 <div className="space-y-4">
//                   <input
//                     placeholder="Street Address"
//                     name="personalDetails.address.street"
//                     value={formData.personalDetails.address.street}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                   />
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <input
//                       placeholder="City"
//                       name="personalDetails.address.city"
//                       value={formData.personalDetails.address.city}
//                       onChange={handleChange}
//                       className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                     />
//                     <input
//                       placeholder="State"
//                       name="personalDetails.address.state"
//                       value={formData.personalDetails.address.state}
//                       onChange={handleChange}
//                       className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                     />
//                     <input
//                       placeholder="ZIP Code"
//                       name="personalDetails.address.zipCode"
//                       value={formData.personalDetails.address.zipCode}
//                       onChange={handleChange}
//                       className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Job Details */}
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
//             <div className="p-6 border-b border-slate-200">
//               <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
//                 <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
//                   <Briefcase className="w-4 h-4 text-green-600" />
//                 </div>
//                 Job Information
//               </h2>
//               <p className="text-slate-600 text-sm mt-1">
//                 Employee's role and employment details
//               </p>
//             </div>

//             <div className="p-6 space-y-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label
//                     htmlFor="department"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     Department <span className="text-red-500">*</span>
//                   </label>
//                   <select
//                     id="department"
//                     name="jobDetails.department"
//                     value={formData.jobDetails.department}
//                     onChange={handleChange}
//                     className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white transition-colors ${
//                       errors.department
//                         ? "border-red-300 focus:ring-red-500 focus:border-red-500"
//                         : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
//                     }`}
//                   >
//                     <option value="">Select department</option>
//                     {departmentOptions.map((dept, index) => (
//                       <option key={index} value={dept.value}>
//                         {dept.label}
//                       </option>
//                     ))}
//                   </select>
//                   {errors.department && (
//                     <div className="flex items-center space-x-1 text-red-600 text-sm">
//                       <AlertCircle className="w-4 h-4" />
//                       <span>{errors.department}</span>
//                     </div>
//                   )}
//                 </div>
//                 <div className="space-y-2">
//                   <label
//                     htmlFor="designation"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     Designation <span className="text-red-500">*</span>
//                   </label>
//                   <select
//                     id="designation"
//                     name="jobDetails.designation"
//                     value={formData.jobDetails.designation}
//                     onChange={handleChange}
//                     className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white transition-colors ${
//                       errors.designation
//                         ? "border-red-300 focus:ring-red-500 focus:border-red-500"
//                         : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
//                     }`}
//                   >
//                     <option value="">Select Designation</option>
//                     {designationOptions.map((dept, index) => (
//                       <option key={index} value={dept.value}>
//                         {dept.label}
//                       </option>
//                     ))}
//                   </select>
//                   {errors.designation && (
//                     <div className="flex items-center space-x-1 text-red-600 text-sm">
//                       <AlertCircle className="w-4 h-4" />
//                       <span>{errors.designation}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label
//                     htmlFor="employmentType"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     Employment Type
//                   </label>
//                   <select
//                     id="employmentType"
//                     name="jobDetails.employmentType"
//                     value={formData.jobDetails.employmentType}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white transition-colors"
//                   >
//                     {employmentTypeOptions.map((option) => (
//                       <option key={option} value={option}>
//                         {option}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="space-y-2">
//                   <label
//                     htmlFor="workLocation"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     Work Location
//                   </label>
//                   <input
//                     id="workLocation"
//                     name="jobDetails.workLocation"
//                     value={formData.jobDetails.workLocation}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                     placeholder="e.g., New York Office, Remote"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <label
//                   htmlFor="status"
//                   className="block text-sm font-semibold text-slate-700"
//                 >
//                   Status
//                 </label>
//                 <select
//                   id="status"
//                   name="status"
//                   value={formData.status}
//                   onChange={handleChange}
//                   className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white transition-colors"
//                 >
//                   {statusOptions.map((option) => (
//                     <option key={option} value={option}>
//                       {option}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Salary & Bank Details */}
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
//             <div className="p-6 border-b border-slate-200">
//               <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
//                 <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
//                   <CreditCard className="w-4 h-4 text-yellow-600" />
//                 </div>
//                 Salary & Bank Details
//               </h2>
//               <p className="text-slate-600 text-sm mt-1">
//                 Financial information and bank account details
//               </p>
//             </div>

//             <div className="p-6 space-y-6">
//               {/* Salary and PAN */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label
//                     htmlFor="basicSalary"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     Basic Salary (₹) <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <ReceiptIndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
//                     <input
//                       id="basicSalary"
//                       name="salaryDetails.basicSalary"
//                       type="number"
//                       value={formData.salaryDetails.basicSalary}
//                       onChange={handleChange}
//                       className={`w-full  pl-11 pr-4 px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
//                         errors.basicSalary
//                           ? "border-red-300 focus:ring-red-500 focus:border-red-500"
//                           : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
//                       }`}
//                       placeholder="Enter basic salary"
//                     />
//                   </div>
//                   {errors.basicSalary && (
//                     <div className="flex items-center space-x-1 text-red-600 text-sm">
//                       <AlertCircle className="w-4 h-4" />
//                       <span>{errors.basicSalary}</span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <label
//                     htmlFor="panNumber"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     PAN Number
//                   </label>
//                   <input
//                     id="panNumber"
//                     name="salaryDetails.panNumber"
//                     value={formData.salaryDetails.panNumber}
//                     onChange={handleChange}
//                     maxLength={10}
//                     className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                     placeholder="e.g., ABCDE1234F"
//                   />
//                 </div>
//               </div>

//               {/* Bank Account Details */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label
//                     htmlFor="accountNumber"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     Account Number <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <Landmark className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
//                     <input
//                       id="accountNumber"
//                       name="salaryDetails.bankAccount.accountNumber"
//                       value={formData.salaryDetails.bankAccount.accountNumber}
//                       onChange={handleChange}
//                       maxLength={20}
//                       className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
//                         errors.accountNumber
//                           ? "border-red-300 focus:ring-red-500 focus:border-red-500"
//                           : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
//                       }`}
//                       placeholder="Enter account number"
//                     />
//                   </div>
//                   {errors.accountNumber && (
//                     <div className="flex items-center space-x-1 text-red-600 text-sm">
//                       <AlertCircle className="w-4 h-4" />
//                       <span>{errors.accountNumber}</span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <label
//                     htmlFor="bankName"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     Bank Name <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     id="bankName"
//                     name="salaryDetails.bankAccount.bankName"
//                     value={formData.salaryDetails.bankAccount.bankName}
//                     onChange={handleChange}
//                     maxLength={40}
//                     className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
//                       errors.bankName
//                         ? "border-red-300 focus:ring-red-500 focus:border-red-500"
//                         : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
//                     }`}
//                     placeholder="Enter bank name"
//                   />
//                   {errors.bankName && (
//                     <div className="flex items-center space-x-1 text-red-600 text-sm">
//                       <AlertCircle className="w-4 h-4" />
//                       <span>{errors.bankName}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label
//                     htmlFor="ifscCode"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     IFSC Code <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
//                     <input
//                       id="ifscCode"
//                       name="salaryDetails.bankAccount.ifscCode"
//                       value={formData.salaryDetails.bankAccount.ifscCode}
//                       onChange={handleChange}
//                       maxLength={11}
//                       className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
//                         errors.ifscCode
//                           ? "border-red-300 focus:ring-red-500 focus:border-red-500"
//                           : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
//                       }`}
//                       placeholder="e.g., SBIN0000123"
//                     />
//                   </div>
//                   {errors.ifscCode && (
//                     <div className="flex items-center space-x-1 text-red-600 text-sm">
//                       <AlertCircle className="w-4 h-4" />
//                       <span>{errors.ifscCode}</span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <label
//                     htmlFor="branch"
//                     className="block text-sm font-semibold text-slate-700"
//                   >
//                     Branch
//                   </label>
//                   <input
//                     id="branch"
//                     name="salaryDetails.bankAccount.branch"
//                     value={formData.salaryDetails.bankAccount.branch}
//                     onChange={handleChange}
//                     maxLength={40}
//                     className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                     placeholder="Branch name"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <label
//                   htmlFor="aadharNumber"
//                   className="block text-sm font-semibold text-slate-700"
//                 >
//                   Aadhar Number
//                 </label>
//                 <input
//                   id="aadharNumber"
//                   name="salaryDetails.aadharNumber"
//                   value={formData.salaryDetails.aadharNumber}
//                   onChange={handleChange}
//                   maxLength={12}
//                   className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                   placeholder="12-digit Aadhar number"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex items-center justify-between pt-6">
//             <button
//               type="button"
//               onClick={() => window.history.back()}
//               className="inline-flex items-center gap-2 px-6 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
//             >
//               <X className="w-4 h-4" />
//               Cancel
//             </button>

//             <button
//               type="submit"
//               disabled={saving}
//               onClick={handleSubmit}
//               className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:hover:bg-yellow-500 text-white rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {saving ? (
//                 <>
//                   <Loader2 className="w-5 h-5 animate-spin" />
//                   Updating...
//                 </>
//               ) : (
//                 <>
//                   <Save className="w-5 h-5" />
//                   Update Employee
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// "use client";

// import { useState, useEffect } from "react";
// import {
//   Save,
//   X,
//   User,
//   Mail,
//   Phone,
//   Calendar,
//   Building,
//   Briefcase,
//   CreditCard,
//   Landmark,
//   IdCard,
//   AlertCircle,
//   CheckCircle,
//   ArrowLeft,
//   Loader2,
//   Edit3,
//   ReceiptIndianRupee,
// } from "lucide-react";

// import { validators } from "@/utils/validation";   // <-- import

// export default function EmployeeEdit({ employeeId }) {
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [formData, setFormData] = useState({
//     employeeId: "",
//     personalDetails: {
//       firstName: "",
//       lastName: "",
//       email: "",
//       phone: "",
//       address: { street: "", city: "", state: "", zipCode: "" },
//       dateOfJoining: "",
//       dateOfBirth: "",
//       gender: "",
//     },
//     jobDetails: {
//       department: "",
//       designation: "",
//       employmentType: "Full-Time",
//       workLocation: "",
//     },
//     salaryDetails: {
//       basicSalary: "",
//       allowances: [],
//       deductions: [],
//       bankAccount: {
//         accountNumber: "",
//         bankName: "",
//         ifscCode: "",
//         branch: "",
//       },
//       panNumber: "",
//       aadharNumber: "",
//     },
//     status: "Active",
//   });

//   /* -------------------------------------------------
//      FETCH EMPLOYEE (unchanged)
//   ------------------------------------------------- */
//   useEffect(() => {
//     if (employeeId) fetchEmployee();
//   }, [employeeId]);

//   const fetchEmployee = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`/api/payroll/employees/${employeeId}`);
//       if (response.ok) {
//         const employeeData = await response.json();

//         // format dates
//         if (employeeData.personalDetails.dateOfJoining) {
//           employeeData.personalDetails.dateOfJoining = new Date(
//             employeeData.personalDetails.dateOfJoining
//           )
//             .toISOString()
//             .split("T")[0];
//         }
//         if (employeeData.personalDetails.dateOfBirth) {
//           employeeData.personalDetails.dateOfBirth = new Date(
//             employeeData.personalDetails.dateOfBirth
//           )
//             .toISOString()
//             .split("T")[0];
//         }

//         setFormData(employeeData);
//       } else {
//         alert("Failed to load employee data");
//       }
//     } catch (e) {
//       alert("Error loading employee data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* -------------------------------------------------
//      VALIDATE FORM
//   ------------------------------------------------- */
//   const validateForm = () => {
//     const newErrors = {};

//     const p = formData.personalDetails;
//     const j = formData.jobDetails;
//     const s = formData.salaryDetails;
//     const b = s.bankAccount;

//     // ---- REQUIRED ----
//     if (!formData.employeeId) newErrors.employeeId = "Employee ID is required";
//     if (!p.firstName) newErrors.firstName = "First name is required";
//     if (!p.lastName) newErrors.lastName = "Last name is required";
//     if (!p.email) newErrors.email = "Email is required";
//     if (!p.phone) newErrors.phone = "Phone number is required";
//     if (!p.dateOfJoining) newErrors.dateOfJoining = "Date of joining is required";
//     if (!j.department) newErrors.department = "Department is required";
//     if (!j.designation) newErrors.designation = "Designation is required";
//     if (!s.basicSalary) newErrors.basicSalary = "Basic salary is required";
//     if (!b.accountNumber) newErrors.accountNumber = "Account number is required";
//     if (!b.bankName) newErrors.bankName = "Bank name is required";
//     if (!b.ifscCode) newErrors.ifscCode = "IFSC code is required";

//     // ---- FORMAT ----
//     if (p.firstName && !validators.name(p.firstName))
//       newErrors.firstName = "First name may contain only alphabets & spaces";

//     if (p.lastName && !validators.name(p.lastName))
//       newErrors.lastName = "Last name may contain only alphabets & spaces";

//     if (p.email && !validators.email(p.email))
//       newErrors.email = "Enter a valid email address";

//     if (p.phone && !validators.phone(p.phone))
//       newErrors.phone = "Enter a valid 10-digit Indian mobile number";

//     if (s.basicSalary && !validators.positiveNumber(s.basicSalary))
//       newErrors.basicSalary = "Basic salary must be a positive number";

//     if (b.accountNumber && !validators.accountNumber(b.accountNumber))
//       newErrors.accountNumber = "Account number must be 9-18 digits";

//     if (b.ifscCode && !validators.ifsc(b.ifscCode))
//       newErrors.ifscCode = "Invalid IFSC code (e.g. SBIN0001234)";

//     if (s.panNumber && !validators.pan(s.panNumber))
//       newErrors.panNumber = "Invalid PAN (e.g. ABCDE1234F)";

//     if (s.aadharNumber && !validators.aadhar(s.aadharNumber))
//       newErrors.aadharNumber = "Aadhar must be exactly 12 digits";

//     if (p.address.zipCode && !validators.zip(p.address.zipCode))
//       newErrors.zipCode = "ZIP code must be 6 digits";

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   /* -------------------------------------------------
//      HANDLE INPUT CHANGE (real-time validation)
//   ------------------------------------------------- */
//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     // ---- update formData (same logic you already had) ----
//     if (name.includes(".")) {
//       const parts = name.split(".");
//       if (parts.length === 3) {
//         const [parent, child, subChild] = parts;
//         setFormData((prev) => ({
//           ...prev,
//           [parent]: {
//             ...prev[parent],
//             [child]: { ...prev[parent][child], [subChild]: value },
//           },
//         }));
//       } else {
//         const [parent, child] = parts;
//         setFormData((prev) => ({
//           ...prev,
//           [parent]: { ...prev[parent], [child]: value },
//         }));
//       }
//     } else {
//       setFormData((prev) => ({ ...prev, [name]: value }));
//     }

//     // ---- live validation (clear error + check format) ----
//     const field = name.split(".").pop();
//     const err = {};

//     switch (field) {
//       case "firstName":
//         if (value && !validators.name(value))
//           err.firstName = "Alphabets only";
//         break;
//       case "lastName":
//         if (value && !validators.name(value))
//           err.lastName = "Alphabets only";
//         break;
//       case "email":
//         if (value && !validators.email(value))
//           err.email = "Invalid email";
//         break;
//       case "phone":
//         if (value && !validators.phone(value))
//           err.phone = "Invalid mobile";
//         break;
//       case "basicSalary":
//         if (value && !validators.positiveNumber(value))
//           err.basicSalary = "Positive number";
//         break;
//       case "accountNumber":
//         if (value && !validators.accountNumber(value))
//           err.accountNumber = "9-18 digits";
//         break;
//       case "ifscCode":
//         if (value && !validators.ifsc(value))
//           err.ifscCode = "Invalid IFSC";
//         break;
//       case "panNumber":
//         if (value && !validators.pan(value))
//           err.panNumber = "Invalid PAN";
//         break;
//       case "aadharNumber":
//         if (value && !validators.aadhar(value))
//           err.aadharNumber = "12 digits";
//         break;
//       case "zipCode":
//         if (value && !validators.zip(value))
//           err.zipCode = "6 digits";
//         break;
//       default:
//         break;
//     }

//     setErrors((prev) => ({ ...prev, ...err, [field]: err[field] ?? "" }));
//   };

//   /* -------------------------------------------------
//      SUBMIT
//   ------------------------------------------------- */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) return;

//     setSaving(true);
//     try {
//       const response = await fetch(`/api/payroll/employees/${employeeId}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(formData),
//       });

//       if (response.ok) {
//         alert("Employee updated successfully!");
//         window.location.href = `/payroll/employees/${employeeId}`;
//       } else {
//         const data = await response.json();
//         alert(`Error: ${data.error}`);
//       }
//     } catch (err) {
//       alert("An error occurred while updating the employee");
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* -------------------------------------------------
//      OPTIONS (unchanged)
//   ------------------------------------------------- */
//   const departmentOptions = [
//     { value: "odt", label: "Operations & Data Team" },
//     { value: "art", label: "Analysis & Reporting Team" },
//     { value: "scm", label: "Supply Chain Management" },
//     { value: "acc", label: "Accounts & Finance" },
//   ];
//   const designationOptions = [
//     { value: "Employee", label: "Employee" },
//     { value: "Supervisor", label: "Supervisor" },
//   ];
//   const employmentTypeOptions = ["Full-Time", "Part-Time", "Contract", "Intern"];
//   const statusOptions = ["Active", "Inactive", "Suspended", "Terminated"];
//   const genderOptions = ["Male", "Female", "Other"];

//   /* -------------------------------------------------
//      LOADING UI (unchanged)
//   ------------------------------------------------- */
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center">
//         <div className="flex items-center space-x-3">
//           <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
//           <span className="text-slate-600 font-medium">
//             Loading employee data...
//           </span>
//         </div>
//       </div>
//     );
//   }

//   /* -------------------------------------------------
//      MAIN RETURN (only a few inputs changed)
//   ------------------------------------------------- */
//   return (
//     <div className="min-h-screen bg-slate-50">
//              <div className="max-w-7xl mx-auto px-6 py-8">
//         {/* Header */}
//          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
//            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
//              <div className="flex items-center gap-4">
//                <button
//                  onClick={() => window.history.back()}
//                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
//                >
//                  <ArrowLeft className="w-5 h-5" />
//                </button>

//                <div className="flex items-center gap-4">
//                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
//                    <Edit3 className="w-8 h-8 text-white" />
//                  </div>
//                  <div>
//                    <h1 className="text-2xl font-bold text-slate-900 mb-1">
//                      Edit Employee
//                    </h1>
//                    <p className="text-slate-600">
//                      Update employee information and details
//                    </p>
//                  </div>
//                </div>
//              </div>
//              <button
//                onClick={() => window.history.back()}
//                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
//              >
//                <X className="w-4 h-4" />
//                Cancel
//              </button>
//            </div>
//          </div>
//          </div>
//       {/* FORM */}
//       <form onSubmit={handleSubmit} className="space-y-8">
//         {/* ==== PERSONAL DETAILS ==== */}
//         <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
//           {/* ... section header ... */}

//           <div className="p-6 space-y-6">
//             {/* Employee ID & DOJ */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* Employee ID (disabled) */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   Employee ID <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   name="employeeId"
//                   value={formData.employeeId}
//                   disabled
//                   className={`w-full px-4 py-3 border rounded-lg text-sm bg-slate-50 cursor-not-allowed ${
//                     errors.employeeId ? "border-red-300" : "border-slate-300"
//                   }`}
//                 />
//                 {errors.employeeId && (
//                   <p className="flex items-center gap-1 text-red-600 text-sm">
//                     <AlertCircle className="w-4 h-4" />
//                     {errors.employeeId}
//                   </p>
//                 )}
//               </div>

//               {/* Date of Joining */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   Date of Joining <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
//                   <input
//                     type="date"
//                     name="personalDetails.dateOfJoining"
//                     value={formData.personalDetails.dateOfJoining}
//                     onChange={handleChange}
//                     className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
//                       errors.dateOfJoining
//                         ? "border-red-300 focus:ring-red-500"
//                         : "border-slate-300 focus:ring-yellow-500"
//                     }`}
//                   />
//                 </div>
//                 {errors.dateOfJoining && (
//                   <p className="flex items-center gap-1 text-red-600 text-sm">
//                     <AlertCircle className="w-4 h-4" />
//                     {errors.dateOfJoining}
//                   </p>
//                 )}
//               </div>
//             </div>

//             {/* First / Last Name */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   First Name <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   name="personalDetails.firstName"
//                   value={formData.personalDetails.firstName}
//                   onChange={handleChange}
//                   maxLength={40}
//                   placeholder="Enter first name"
//                   className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
//                     errors.firstName
//                       ? "border-red-300 focus:ring-red-500"
//                       : "border-slate-300 focus:ring-yellow-500"
//                   }`}
//                 />
//                 {errors.firstName && (
//                   <p className="flex items-center gap-1 text-red-600 text-sm">
//                     <AlertCircle className="w-4 h-4" />
//                     {errors.firstName}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   Last Name <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   name="personalDetails.lastName"
//                   value={formData.personalDetails.lastName}
//                   onChange={handleChange}
//                   maxLength={40}
//                   placeholder="Enter last name"
//                   className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
//                     errors.lastName
//                       ? "border-red-300 focus:ring-red-500"
//                       : "border-slate-300 focus:ring-yellow-500"
//                   }`}
//                 />
//                 {errors.lastName && (
//                   <p className="flex items-center gap-1 text-red-600 text-sm">
//                     <AlertCircle className="w-4 h-4" />
//                     {errors.lastName}
//                   </p>
//                 )}
//               </div>
//             </div>

//             {/* Email & Phone */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   Email <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
//                   <input
//                     type="email"
//                     name="personalDetails.email"
//                     value={formData.personalDetails.email}
//                     onChange={handleChange}
//                     placeholder="Enter email address"
//                     className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
//                       errors.email
//                         ? "border-red-300 focus:ring-red-500"
//                         : "border-slate-300 focus:ring-yellow-500"
//                     }`}
//                   />
//                 </div>
//                 {errors.email && (
//                   <p className="flex items-center gap-1 text-red-600 text-sm">
//                     <AlertCircle className="w-4 h-4" />
//                     {errors.email}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   Phone <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
//                   <input
//                     type="tel"
//                     name="personalDetails.phone"
//                     value={formData.personalDetails.phone}
//                     onChange={handleChange}
//                     maxLength={10}
//                     placeholder="Enter phone number"
//                     className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
//                       errors.phone
//                         ? "border-red-300 focus:ring-red-500"
//                         : "border-slate-300 focus:ring-yellow-500"
//                     }`}
//                   />
//                 </div>
//                 {errors.phone && (
//                   <p className="flex items-center gap-1 text-red-600 text-sm">
//                     <AlertCircle className="w-4 h-4" />
//                     {errors.phone}
//                   </p>
//                 )}
//               </div>
//             </div>

//             {/* DOB & Gender */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   Date of Birth
//                 </label>
//                 <div className="relative">
//                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
//                   <input
//                     type="date"
//                     name="personalDetails.dateOfBirth"
//                     value={formData.personalDetails.dateOfBirth}
//                     onChange={handleChange}
//                     className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   Gender
//                 </label>
//                 <select
//                   name="personalDetails.gender"
//                   value={formData.personalDetails.gender}
//                   onChange={handleChange}
//                   className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
//                 >
//                   <option value="">Select gender</option>
//                   {genderOptions.map((opt) => (
//                     <option key={opt} value={opt}>
//                       {opt}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             {/* Address */}
//             <div className="space-y-4 pt-4 border-t border-slate-200">
//               <label className="block text-sm font-semibold text-slate-700">
//                 Address
//               </label>
//               <input
//                 placeholder="Street Address"
//                 name="personalDetails.address.street"
//                 value={formData.personalDetails.address.street}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
//               />
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <input
//                   placeholder="City"
//                   name="personalDetails.address.city"
//                   value={formData.personalDetails.address.city}
//                   onChange={handleChange}
//                   className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
//                 />
//                 <input
//                   placeholder="State"
//                   name="personalDetails.address.state"
//                   value={formData.personalDetails.address.state}
//                   onChange={handleChange}
//                   maxLength={40}
//                   className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
//                 />
//                 <input
//                   placeholder="ZIP Code"
//                   name="personalDetails.address.zipCode"
//                   value={formData.personalDetails.address.zipCode}
//                   onChange={handleChange}
//                   maxLength={6}
//                   className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
//                     errors.zipCode
//                       ? "border-red-300 focus:ring-red-500"
//                       : "border-slate-300 focus:ring-yellow-500"
//                   }`}
//                 />
//                 {errors.zipCode && (
//                   <p className="col-span-3 flex items-center gap-1 text-red-600 text-sm">
//                     <AlertCircle className="w-4 h-4" />
//                     {errors.zipCode}
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ==== JOB DETAILS ==== */}
//         {/* (unchanged – only department & designation are required) */}

//         {/* ==== SALARY & BANK ==== */}
//         <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
//           {/* ... header ... */}

//           <div className="p-6 space-y-6">
//             {/* Basic Salary & PAN */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   Basic Salary (Rupee) <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <ReceiptIndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
//                   <input
//                     type="number"
//                     name="salaryDetails.basicSalary"
//                     value={formData.salaryDetails.basicSalary}
//                     onChange={handleChange}
//                     placeholder="Enter basic salary"
//                     className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
//                       errors.basicSalary
//                         ? "border-red-300 focus:ring-red-500"
//                         : "border-slate-300 focus:ring-yellow-500"
//                     }`}
//                   />
//                 </div>
//                 {errors.basicSalary && (
//                   <p className="flex items-center gap-1 text-red-600 text-sm">
//                     <AlertCircle className="w-4 h-4" />
//                     {errors.basicSalary}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   PAN Number
//                 </label>
//                 <input
//                   name="salaryDetails.panNumber"
//                   value={formData.salaryDetails.panNumber}
//                   onChange={(e) => {
//                     e.target.value = e.target.value.toUpperCase();
//                     handleChange(e);
//                   }}
//                   maxLength={10}
//                   placeholder="e.g. ABCDE1234F"
//                   className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
//                     errors.panNumber
//                       ? "border-red-300 focus:ring-red-500"
//                       : "border-slate-300 focus:ring-yellow-500"
//                   }`}
//                 />
//                 {errors.panNumber && (
//                   <p className="flex items-center gap-1 text-red-600 text-sm">
//                     <AlertCircle className="w-4 h-4" />
//                     {errors.panNumber}
//                   </p>
//                 )}
//               </div>
//             </div>

//             {/* Bank Account Details */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   Account Number <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
//                   <input
//                     name="salaryDetails.bankAccount.accountNumber"
//                     value={formData.salaryDetails.bankAccount.accountNumber}
//                     onChange={handleChange}
//                     maxLength={18}
//                     placeholder="Enter account number"
//                     className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
//                       errors.accountNumber
//                         ? "border-red-300 focus:ring-red-500"
//                         : "border-slate-300 focus:ring-yellow-500"
//                     }`}
//                   />
//                 </div>
//                 {errors.accountNumber && (
//                   <p className="flex items-center gap-1 text-red-600 text-sm">
//                     <AlertCircle className="w-4 h-4" />
//                     {errors.accountNumber}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   Bank Name <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   name="salaryDetails.bankAccount.bankName"
//                   value={formData.salaryDetails.bankAccount.bankName}
//                   onChange={handleChange}
//                   maxLength={40}
//                   placeholder="Enter bank name"
//                   className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
//                     errors.bankName
//                       ? "border-red-300 focus:ring-red-500"
//                       : "border-slate-300 focus:ring-yellow-500"
//                   }`}
//                 />
//                 {errors.bankName && (
//                   <p className="flex items-center gap-1 text-red-600 text-sm">
//                     <AlertCircle className="w-4 h-4" />
//                     {errors.bankName}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   IFSC Code <span className="text-red-500">*</span>
//                 </label>
//                 <div className="relative">
//                   <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
//                   <input
//                     name="salaryDetails.bankAccount.ifscCode"
//                     value={formData.salaryDetails.bankAccount.ifscCode}
//                     onChange={(e) => {
//                       e.target.value = e.target.value.toUpperCase();
//                       handleChange(e);
//                     }}
//                     maxLength={11}
//                     placeholder="e.g. SBIN0000123"
//                     className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
//                       errors.ifscCode
//                         ? "border-red-300 focus:ring-red-500"
//                         : "border-slate-300 focus:ring-yellow-500"
//                     }`}
//                   />
//                 </div>
//                 {errors.ifscCode && (
//                   <p className="flex items-center gap-1 text-red-600 text-sm">
//                     <AlertCircle className="w-4 h-4" />
//                     {errors.ifscCode}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-2">
//                 <label className="block text-sm font-semibold text-slate-700">
//                   Branch
//                 </label>
//                 <input
//                   name="salaryDetails.bankAccount.branch"
//                   value={formData.salaryDetails.bankAccount.branch}
//                   onChange={handleChange}
//                   maxLength={40}
//                   placeholder="Branch name"
//                   className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <label className="block text-sm font-semibold text-slate-700">
//                 Aadhar Number
//               </label>
//               <input
//                 name="salaryDetails.aadharNumber"
//                 value={formData.salaryDetails.aadharNumber}
//                 onChange={handleChange}
//                 maxLength={12}
//                 placeholder="12-digit Aadhar number"
//                 className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
//                   errors.aadharNumber
//                     ? "border-red-300 focus:ring-red-500"
//                     : "border-slate-300 focus:ring-yellow-500"
//                 }`}
//               />
//               {errors.aadharNumber && (
//                 <p className="flex items-center gap-1 text-red-600 text-sm">
//                   <AlertCircle className="w-4 h-4" />
//                   {errors.aadharNumber}
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* ==== ACTION BUTTONS ==== */}
//         <div className="flex items-center justify-between pt-6">
//           <button
//             type="button"
//             onClick={() => window.history.back()}
//             className="inline-flex items-center gap-2 px-6 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
//           >
//             <X className="w-4 h-4" />
//             Cancel
//           </button>

//           <button
//             type="submit"
//             disabled={saving}
//             className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:hover:bg-yellow-500 text-white rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {saving ? (
//               <>
//                 <Loader2 className="w-5 h-5 animate-spin" />
//                 Updating...
//               </>
//             ) : (
//               <>
//                 <Save className="w-5 h-5" />
//                 Update Employee
//               </>
//             )}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import {
  Save,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Briefcase,
  CreditCard,
  Bank,
  IdCard,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Edit3,
  Landmark,
  ReceiptIndianRupee,
} from "lucide-react";
import { validators } from "@/utils/validation";

export default function EmployeeEdit({ employeeId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    if (employeeId) {
      fetchEmployee();
    }
  }, [employeeId]);

const fetchEmployee = async () => {
  try {
    setLoading(true);
    const response = await fetch(`/api/payroll/employees/${employeeId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to fetch employee:", errorData);
      alert(`Failed to load employee data: ${errorData.error || 'Unknown error'}`);
      return;
    }
    
    const employeeData = await response.json();
    console.log("Fetched employee data:", employeeData); // Debug log
    
    // Format dates for input fields
    if (employeeData.personalDetails?.dateOfJoining) {
      employeeData.personalDetails.dateOfJoining = new Date(
        employeeData.personalDetails.dateOfJoining
      )
        .toISOString()
        .split("T")[0];
    }
    if (employeeData.personalDetails?.dateOfBirth) {
      employeeData.personalDetails.dateOfBirth = new Date(
        employeeData.personalDetails.dateOfBirth
      )
        .toISOString()
        .split("T")[0];
    }
    
    setFormData(employeeData);
  } catch (error) {
    console.error("Error fetching employee:", error);
    alert("Error loading employee data: " + error.message);
  } finally {
    setLoading(false);
  }
};

  const validateForm = () => {
    const newErrors = {};

    const p = formData.personalDetails;
    const j = formData.jobDetails;
    const s = formData.salaryDetails;
    const b = s.bankAccount;

    // Required field validation
    if (!formData.employeeId?.trim())
      newErrors.employeeId = "Employee ID is required";
    if (!p.firstName?.trim()) newErrors.firstName = "First name is required";
    if (!p.lastName?.trim()) newErrors.lastName = "Last name is required";
    if (!p.email?.trim()) newErrors.email = "Email is required";
    if (!p.phone?.trim()) newErrors.phone = "Phone number is required";
    if (!p.dateOfJoining)
      newErrors.dateOfJoining = "Date of joining is required";
    if (!j.department?.trim()) newErrors.department = "Department is required";
    if (!j.designation?.trim())
      newErrors.designation = "Designation is required";
if (!s.basicSalary && s.basicSalary !== 0)
  newErrors.basicSalary = "Basic salary is required";

    if (!b.accountNumber?.trim())
      newErrors.accountNumber = "Account number is required";
    if (!b.bankName?.trim()) newErrors.bankName = "Bank name is required";
    if (!b.ifscCode?.trim()) newErrors.ifscCode = "IFSC code is required";

    // Format validation using the shared validators
    if (p.firstName && !validators.name(p.firstName))
      newErrors.firstName =
        "First name may contain only alphabets & spaces (max 40 chars)";

    if (p.lastName && !validators.name(p.lastName))
      newErrors.lastName =
        "Last name may contain only alphabets & spaces (max 40 chars)";

    if (p.email && !validators.email(p.email))
      newErrors.email = "Enter a valid email address";

    if (p.phone && !validators.phone(p.phone))
      newErrors.phone = "Enter a valid 10-digit Indian mobile number";

if (s.basicSalary && !validators.positiveNumber(String(s.basicSalary)))
  newErrors.basicSalary = "Basic salary must be a positive number";

    if (b.accountNumber && !validators.accountNumber(b.accountNumber))
      newErrors.accountNumber = "Account number must be 9-18 digits";

    if (b.ifscCode && !validators.ifsc(b.ifscCode))
      newErrors.ifscCode = "Invalid IFSC code (e.g. SBIN0001234)";

    if (s.panNumber && !validators.pan(s.panNumber))
      newErrors.panNumber = "Invalid PAN (e.g. ABCDE1234F)";

    if (s.aadharNumber && !validators.aadhar(s.aadharNumber))
      newErrors.aadharNumber = "Aadhar must be exactly 12 digits";

    if (p.address.zipCode && !validators.zip(p.address.zipCode))
      newErrors.zipCode = "ZIP code must be 6 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle field-specific formatting
    let processedValue = value;
    if (
      name === "salaryDetails.panNumber" ||
      name === "salaryDetails.bankAccount.ifscCode"
    ) {
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    } else if (name === "personalDetails.phone") {
      processedValue = value.replace(/\D/g, "").slice(0, 10);
    } else if (
      name === "salaryDetails.aadharNumber" ||
      name === "personalDetails.address.zipCode"
    ) {
      processedValue = value.replace(/\D/g, "");
    }

    // Update form data
    if (name.includes(".")) {
      const [parent, child, subChild] = name.split(".");

      if (subChild) {
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: processedValue,
            },
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: processedValue,
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: processedValue,
      }));
    }

    // Real-time validation with proper error clearing
    const fieldName = name.split(".").pop();
    const fieldValue = processedValue;

    setErrors((prev) => {
      const newErrors = { ...prev };

      // Clear error when field is empty or valid
      if (!fieldValue || isValidField(fieldName, fieldValue)) {
        delete newErrors[fieldName];
      } else {
        // Set appropriate error message
        newErrors[fieldName] = getErrorMessage(fieldName, fieldValue);
      }

      return newErrors;
    });
  };

  // Helper function to validate individual fields
  const isValidField = (fieldName, value) => {
    if (!value) return true; // Empty fields are valid for real-time validation

    switch (fieldName) {
      case "firstName":
      case "lastName":
        return validators.name(value);
      case "email":
        return validators.email(value);
      case "phone":
        return validators.phone(value);
      case "basicSalary":
        return validators.positiveNumber(String(value));
      case "accountNumber":
        return validators.accountNumber(value);
      case "ifscCode":
        return validators.ifsc(value);
      case "panNumber":
        return validators.pan(value);
      case "aadharNumber":
        return validators.aadhar(value);
      case "zipCode":
        return validators.zip(value);
      default:
        return true;
    }
  };

  // Helper function to get error messages
  const getErrorMessage = (fieldName, value) => {
    const messages = {
      firstName:
        "First name may contain only alphabets & spaces (max 40 chars)",
      lastName: "Last name may contain only alphabets & spaces (max 40 chars)",
      email: "Enter a valid email address",
      phone: "Enter a valid 10-digit Indian mobile number",
      basicSalary: "Basic salary must be a positive number",
      accountNumber: "Account number must be 9-18 digits",
      ifscCode: "Invalid IFSC code (e.g. SBIN0001234)",
      panNumber: "Invalid PAN (e.g. ABCDE1234F)",
      aadharNumber: "Aadhar must be exactly 12 digits",
      zipCode: "ZIP code must be 6 digits",
    };

    return messages[fieldName] || "Invalid value";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/payroll/employees/${employeeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Employee updated successfully!");
        window.location.href = `/payroll/employees/${employeeId}`;
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("An error occurred while updating the employee");
    } finally {
      setSaving(false);
    }
  };

  const departmentOptions = [
    { value: "odt", label: "Operations & Data Team" },
    { value: "art", label: "Analysis & Reporting Team" },
    { value: "scm", label: "Supply Chain Management" },
    { value: "acc", label: "Accounts & Finance" },
  ];
  const designationOptions = [
    { value: "Employee", label: "Employee" },
    { value: "Supervisor", label: "Supervisor" },
  ];

  const employmentTypeOptions = [
    "Full-Time",
    "Part-Time",
    "Contract",
    "Intern",
  ];

  const statusOptions = ["Active", "Inactive", "Suspended", "Terminated"];

  const genderOptions = ["Male", "Female", "Other"];

if (loading) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
          <span className="text-slate-700 font-medium">
            Loading employee data...
          </span>
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Edit3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    Edit Employee
                  </h1>
                  <p className="text-slate-600">
                    Update employee information and details
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                Personal Information
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Employee's personal information and contact details
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Employee ID and Date of Joining */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="employeeId"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    disabled
                    className={`w-full px-4 py-3 border rounded-lg text-sm bg-slate-50 cursor-not-allowed transition-colors ${
                      errors.employeeId ? "border-red-300" : "border-slate-300"
                    }`}
                  />
                  {errors.employeeId && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.employeeId}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="dateOfJoining"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Date of Joining <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="dateOfJoining"
                      name="personalDetails.dateOfJoining"
                      type="date"
                      value={formData.personalDetails.dateOfJoining}
                      onChange={handleChange}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                        errors.dateOfJoining
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                      }`}
                    />
                  </div>
                  {errors.dateOfJoining && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.dateOfJoining}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    name="personalDetails.firstName"
                    value={formData.personalDetails.firstName}
                    onChange={handleChange}
                    maxLength={40}
                    className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.firstName
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                    }`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.firstName}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    name="personalDetails.lastName"
                    value={formData.personalDetails.lastName}
                    onChange={handleChange}
                    maxLength={40}
                    className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.lastName
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                    }`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.lastName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="email"
                      name="personalDetails.email"
                      type="email"
                      value={formData.personalDetails.email}
                      onChange={handleChange}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                        errors.email
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                      }`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="phone"
                      name="personalDetails.phone"
                      type="tel"
                      pattern="[6-9]\d{9}"
                      title="10-digit Indian mobile number starting with 6-9"
                      value={formData.personalDetails.phone}
                      onChange={handleChange}
                      maxLength={10}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                        errors.phone
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                      }`}
                      placeholder="Enter phone number"
                    />
                  </div>
                  {errors.phone && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Date of Birth and Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="dateOfBirth"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="dateOfBirth"
                      name="personalDetails.dateOfBirth"
                      type="date"
                      value={formData.personalDetails.dateOfBirth}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="gender"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="personalDetails.gender"
                    value={formData.personalDetails.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white transition-colors"
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <label className="block text-sm font-semibold text-slate-700">
                  Address
                </label>
                <div className="space-y-4">
                  <input
                    placeholder="Street Address"
                    name="personalDetails.address.street"
                    value={formData.personalDetails.address.street}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      placeholder="City"
                      name="personalDetails.address.city"
                      value={formData.personalDetails.address.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    />
                    <input
                      placeholder="State"
                      name="personalDetails.address.state"
                      value={formData.personalDetails.address.state}
                      onChange={handleChange}
                      maxLength={40}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    />
                    <input
                      placeholder="ZIP Code"
                      name="personalDetails.address.zipCode"
                      value={formData.personalDetails.address.zipCode}
                      onChange={handleChange}
                      maxLength={6}
                      className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                        errors.zipCode
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                      }`}
                    />
                  </div>
                  {errors.zipCode && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.zipCode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                  <Briefcase className="w-4 h-4 text-green-600" />
                </div>
                Job Information
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Employee's role and employment details
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="department"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="department"
                    name="jobDetails.department"
                    value={formData.jobDetails.department}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white transition-colors ${
                      errors.department
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                    }`}
                  >
                    <option value="">Select department</option>
                    {departmentOptions.map((dept, index) => (
                      <option key={index} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.department}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="designation"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="designation"
                    name="jobDetails.designation"
                    value={formData.jobDetails.designation}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white transition-colors ${
                      errors.designation
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                    }`}
                  >
                    <option value="">Select Designation</option>
                    {designationOptions.map((dept, index) => (
                      <option key={index} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                  {errors.designation && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.designation}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="employmentType"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Employment Type
                  </label>
                  <select
                    id="employmentType"
                    name="jobDetails.employmentType"
                    value={formData.jobDetails.employmentType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white transition-colors"
                  >
                    {employmentTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="workLocation"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Work Location
                  </label>
                  <input
                    id="workLocation"
                    name="jobDetails.workLocation"
                    value={formData.jobDetails.workLocation}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    placeholder="e.g., New York Office, Remote"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="status"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white transition-colors"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Salary & Bank Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                  <CreditCard className="w-4 h-4 text-yellow-600" />
                </div>
                Salary & Bank Details
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Financial information and bank account details
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Salary and PAN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="basicSalary"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Basic Salary (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <ReceiptIndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="basicSalary"
                      name="salaryDetails.basicSalary"
                      type="number"
                      value={formData.salaryDetails.basicSalary}
                      onChange={handleChange}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                        errors.basicSalary
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                      }`}
                      placeholder="Enter basic salary"
                    />
                  </div>
                  {errors.basicSalary && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.basicSalary}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="panNumber"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    PAN Number
                  </label>
                  <input
                    id="panNumber"
                    name="salaryDetails.panNumber"
                    value={formData.salaryDetails.panNumber}
                    pattern="[A-Z]{5}\d{4}[A-Z]{1}"
                    title="5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)"
                    onChange={handleChange}
                    maxLength={10}
                    className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.panNumber
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                    }`}
                    placeholder="e.g., ABCDE1234F"
                  />
                  {errors.panNumber && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.panNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="accountNumber"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Landmark className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="accountNumber"
                      name="salaryDetails.bankAccount.accountNumber"
                      value={formData.salaryDetails.bankAccount.accountNumber}
                      onChange={handleChange}
                      maxLength={18}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                        errors.accountNumber
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                      }`}
                      placeholder="Enter account number"
                    />
                  </div>
                  {errors.accountNumber && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.accountNumber}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="bankName"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="bankName"
                    name="salaryDetails.bankAccount.bankName"
                    value={formData.salaryDetails.bankAccount.bankName}
                    onChange={handleChange}
                    maxLength={40}
                    className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.bankName
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                    }`}
                    placeholder="Enter bank name"
                  />
                  {errors.bankName && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.bankName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="ifscCode"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="ifscCode"
                      name="salaryDetails.bankAccount.ifscCode"
                      value={formData.salaryDetails.bankAccount.ifscCode}
                      onChange={handleChange}
                      maxLength={11}
                      pattern="[A-Z]{4}0[A-Z0-9]{6}"
                      title="4 letters, 0, 6 alphanumeric characters"
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                        errors.ifscCode
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                      }`}
                      placeholder="e.g., SBIN0000123"
                    />
                  </div>
                  {errors.ifscCode && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.ifscCode}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="branch"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Branch
                  </label>
                  <input
                    id="branch"
                    name="salaryDetails.bankAccount.branch"
                    value={formData.salaryDetails.bankAccount.branch}
                    onChange={handleChange}
                    maxLength={40}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    placeholder="Branch name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="aadharNumber"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Aadhar Number
                </label>
                <input
                  id="aadharNumber"
                  name="salaryDetails.aadharNumber"
                  value={formData.salaryDetails.aadharNumber}
                  onChange={handleChange}
                  maxLength={12}
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    errors.aadharNumber
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                  }`}
                  placeholder="12-digit Aadhar number"
                />
                {errors.aadharNumber && (
                  <div className="flex items-center space-x-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.aadharNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:hover:bg-yellow-500 text-white rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Update Employee
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
