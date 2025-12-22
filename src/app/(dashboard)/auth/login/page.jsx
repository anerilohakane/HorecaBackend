// "use client";

// import { useState } from "react";
// import axios from "axios";
// import { useSession } from "@/context/SessionContext";
// import {
//   Eye,
//   EyeOff,
//   Lock,
//   User,
//   AlertCircle,
//   CheckCircle,
//   Building2,
//   Shield,
//   Calculator,
//   Palette,
//   FileText,
//   Loader2,
//   ArrowRight,
//   BarChart3,
// } from "lucide-react";
// import { useRouter } from "next/navigation";

// export default function LoginPage() {
//   const { login } = useSession();
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [formData, setFormData] = useState({
//     username: "",
//     password: "",
//     department: "scm",
//   });

//   const router = useRouter();

//   const departments = [
//     {
//       value: "odt",
//       label: "ODT",
//       fullName: "Operations & Data Team",
//       icon: FileText,
//       color: "text-blue-600",
//       bgColor: "bg-blue-50",
//       borderColor: "border-blue-200",
//     },
//     {
//       value: "art",
//       label: "ART",
//       fullName: "Analysis & Reporting Team",
//       icon: Palette,
//       color: "text-purple-600",
//       bgColor: "bg-purple-50",
//       borderColor: "border-purple-200",
//     },
//     {
//       value: "scm",
//       label: "SCM",
//       fullName: "Supply Chain Management",
//       icon: Building2,
//       color: "text-green-600",
//       bgColor: "bg-green-50",
//       borderColor: "border-green-200",
//     },
//     {
//       value: "acc",
//       label: "ACC",
//       fullName: "Accounts & Finance",
//       icon: Calculator,
//       color: "text-orange-600",
//       bgColor: "bg-orange-50",
//       borderColor: "border-orange-200",
//     },
//     {
//       value: "admin",
//       label: "Admin",
//       fullName: "System Administrator",
//       icon: Shield,
//       color: "text-red-600",
//       bgColor: "bg-red-50",
//       borderColor: "border-red-200",
//     },
//   ];

//   // Handle form input changes
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     if (errors[name]) {
//       setErrors((prev) => ({ ...prev, [name]: "" }));
//     }
//   };

//   // Form validation
//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.username.trim()) newErrors.username = "Username is required";
//     if (!formData.password.trim()) newErrors.password = "Password is required";
//     if (!formData.department)
//       newErrors.department = "Please select a department";
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Handle form submit
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) return;

//     setLoading(true);

//     try {
//       const response = await login(
//         formData.username.toLowerCase(),
//         formData.password,
//         formData.department
//       );
//       setLoading(false);


//       console.log(response);
      
//       if (response.success) {
//         alert("Login successful! Welcome");
//         router.push("/");
//       } else {
//         alert("Login Failed");

//       }
//     } catch (error) {
//       console.error("Login error:", error);
//       setErrors({
//         general:
//           error.response?.data?.message ||
//           "Login failed. Please check your credentials and try again.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const selectedDept = departments.find((d) => d.value === formData.department);

//   return (
//     <div className="h-screen bg-slate-50 flex overflow-hidden">
//       {/* Left Side */}
//       <div className="hidden lg:flex lg:flex-1 bg-slate-900 relative">
//         <div className="flex flex-col justify-center px-12 py-8 text-white w-full">
//           <div className="mb-8">
//             <div className="flex items-center space-x-4 mb-6">
//               <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
//                 <BarChart3 className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-white">
//                   SupplyChainPro
//                 </h1>
//                 <p className="text-slate-400">Business Management Platform</p>
//               </div>
//             </div>
//           </div>

//           <div className="space-y-6 mb-8">
//             <div>
//               <h3 className="text-lg font-semibold text-white mb-1">
//                 Comprehensive Business Solution
//               </h3>
//               <p className="text-slate-300 text-sm leading-relaxed">
//                 Streamline operations with integrated payroll management and
//                 task coordination.
//               </p>
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-white mb-1">
//                 Role-Based Access Control
//               </h3>
//               <p className="text-slate-300 text-sm leading-relaxed">
//                 Secure departmental access with optimized workflow management.
//               </p>
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-white mb-1">
//                 Enterprise-Grade Security
//               </h3>
//               <p className="text-slate-300 text-sm leading-relaxed">
//                 Advanced security protocols to protect your business data.
//               </p>
//             </div>
//           </div>

//           <div className="border-t border-slate-700 pt-6">
//             <p className="text-slate-400 text-sm">
//               Trusted by businesses worldwide for operational excellence.
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Right Side */}
//       <div className="flex-1 lg:flex-none lg:w-1/2 flex items-center justify-center p-6 bg-white">
//         <div className="w-full max-w-lg">
//           <div className="lg:hidden text-center mb-6">
//             <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-3">
//               <BarChart3 className="w-6 h-6 text-white" />
//             </div>
//             <h1 className="text-xl font-bold text-slate-900">SupplyChainPro</h1>
//           </div>

//           <div className="mb-6">
//             <h2 className="text-xl font-bold text-slate-900 mb-1">Sign In</h2>
//             <p className="text-slate-600 text-sm">
//               Access your business dashboard
//             </p>
//           </div>

//           <div className="space-y-4">
//             {errors.general && (
//               <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//                 <div className="flex items-center space-x-2 text-red-600">
//                   <AlertCircle className="w-4 h-4" />
//                   <span className="text-xs font-medium">{errors.general}</span>
//                 </div>
//               </div>
//             )}

//             {/* Username */}
//             <div className="space-y-1">
//               <label
//                 htmlFor="username"
//                 className="block text-xs font-medium text-slate-700"
//               >
//                 Username
//               </label>
//               <div className="relative flex items-center">
//                 <User className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
//                 <input
//                   id="username"
//                   name="username"
//                   type="text"
//                   value={formData.username}
//                   onChange={handleChange}
//                   placeholder="Enter username"
//                   className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm leading-5 focus:outline-none focus:ring-2 transition-colors ${
//                     errors.username
//                       ? "border-red-300 focus:ring-red-500 focus:border-red-500"
//                       : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
//                   }`}
//                   required
//                 />
//               </div>
//               {errors.username && (
//                 <div className="flex items-center space-x-1 text-red-600 text-xs">
//                   <AlertCircle className="w-3 h-3" />
//                   <span>{errors.username}</span>
//                 </div>
//               )}
//             </div>

//             {/* Password */}
//             <div className="space-y-1">
//               <label
//                 htmlFor="password"
//                 className="block text-xs font-medium text-slate-700"
//               >
//                 Password
//               </label>
//               <div className="relative flex items-center">
//                 <Lock className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
//                 <input
//                   id="password"
//                   name="password"
//                   type={showPassword ? "text" : "password"}
//                   value={formData.password}
//                   onChange={handleChange}
//                   placeholder="Enter password"
//                   className={`w-full pl-10 pr-11 py-2.5 border rounded-lg text-sm leading-5 focus:outline-none focus:ring-2 transition-colors ${
//                     errors.password
//                       ? "border-red-300 focus:ring-red-500 focus:border-red-500"
//                       : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
//                   }`}
//                   required
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
//                 >
//                   {showPassword ? (
//                     <EyeOff className="w-4 h-4" />
//                   ) : (
//                     <Eye className="w-4 h-4" />
//                   )}
//                 </button>
//               </div>
//               {errors.password && (
//                 <div className="flex items-center space-x-1 text-red-600 text-xs">
//                   <AlertCircle className="w-3 h-3" />
//                   <span>{errors.password}</span>
//                 </div>
//               )}
//             </div>

//             {/* Department Selection */}
//             <div className="space-y-2">
//               <label className="block text-xs font-medium text-slate-700">
//                 Department
//               </label>
//               <div className="grid grid-cols-2 gap-2">
//                 {departments.map((dept) => {
//                   const Icon = dept.icon;
//                   const isSelected = formData.department === dept.value;
//                   return (
//                     <label
//                       key={dept.value}
//                       className={`flex items-center p-2.5 border rounded-lg cursor-pointer transition-all hover:bg-slate-50 ${
//                         isSelected
//                           ? "border-yellow-300 bg-yellow-50"
//                           : "border-slate-200 bg-white"
//                       }`}
//                     >
//                       <input
//                         type="radio"
//                         name="department"
//                         value={dept.value}
//                         checked={isSelected}
//                         onChange={handleChange}
//                         className="sr-only"
//                       />
//                       <div
//                         className={`w-6 h-6 rounded flex items-center justify-center mr-2.5 ${
//                           isSelected ? "bg-yellow-100" : "bg-slate-100"
//                         }`}
//                       >
//                         <Icon
//                           className={`w-3 h-3 ${
//                             isSelected ? "text-yellow-600" : "text-slate-500"
//                           }`}
//                         />
//                       </div>
//                       <div className="flex-1">
//                         <div
//                           className={`font-medium text-xs ${
//                             isSelected ? "text-yellow-800" : "text-slate-900"
//                           }`}
//                         >
//                           {dept.label}
//                         </div>
//                         <div className="text-xs text-slate-600">
//                           {dept.fullName}
//                         </div>
//                       </div>
//                       {isSelected && (
//                         <CheckCircle className="w-4 h-4 text-yellow-600" />
//                       )}
//                     </label>
//                   );
//                 })}
//               </div>
//               {errors.department && (
//                 <div className="flex items-center space-x-1 text-red-600 text-xs">
//                   <AlertCircle className="w-3 h-3" />
//                   <span>{errors.department}</span>
//                 </div>
//               )}
//             </div>

//             {/* Submit */}
//             <button
//               type="submit"
//               disabled={loading}
//               onClick={handleSubmit}
//               className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                   Signing In...
//                 </>
//               ) : (
//                 <>
//                   Sign In
//                   <ArrowRight className="w-4 h-4" />
//                 </>
//               )}
//             </button>

//             <div className="text-center space-y-2 pt-2">
//               <button
//                 type="button"
//                 className="text-xs text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
//                 onClick={() =>
//                   alert("Contact your system administrator for password reset")
//                 }
//               >
//                 Forgot password?
//               </button>
//               <p className="text-xs text-slate-500">
//                 Contact IT support for assistance
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// "use client";

// import { useState } from "react";
// import axios from "axios";
// import { useSession } from "@/context/SessionContext";
// import {
//   Eye,
//   EyeOff,
//   Lock,
//   User,
//   AlertCircle,
//   CheckCircle,
//   Building2,
//   Shield,
//   Calculator,
//   Palette,
//   FileText,
//   Loader2,
//   ArrowRight,
//   BarChart3,
// } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { toast, Toaster } from "react-hot-toast";

// export default function LoginPage() {
//   const { login } = useSession();
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [formData, setFormData] = useState({
//     username: "",
//     password: "",
//     department: "scm",
//   });

//   const router = useRouter();

//   const departments = [
//     {
//       value: "odt",
//       label: "ODT",
//       fullName: "Operations & Data Team",
//       icon: FileText,
//       color: "text-blue-600",
//       bgColor: "bg-blue-50",
//       borderColor: "border-blue-200",
//     },
//     {
//       value: "art",
//       label: "ART",
//       fullName: "Analysis & Reporting Team",
//       icon: Palette,
//       color: "text-purple-600",
//       bgColor: "bg-purple-50",
//       borderColor: "border-purple-200",
//     },
//     {
//       value: "scm",
//       label: "SCM",
//       fullName: "Supply Chain Management",
//       icon: Building2,
//       color: "text-green-600",
//       bgColor: "bg-green-50",
//       borderColor: "border-green-200",
//     },
//     {
//       value: "acc",
//       label: "ACC",
//       fullName: "Accounts & Finance",
//       icon: Calculator,
//       color: "text-orange-600",
//       bgColor: "bg-orange-50",
//       borderColor: "border-orange-200",
//     },
//     {
//       value: "admin",
//       label: "Admin",
//       fullName: "System Administrator",
//       icon: Shield,
//       color: "text-red-600",
//       bgColor: "bg-red-50",
//       borderColor: "border-red-200",
//     },
//   ];

//   // Handle form input changes
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     if (errors[name]) {
//       setErrors((prev) => ({ ...prev, [name]: "" }));
//     }
//   };

//   // Form validation
//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.username.trim()) newErrors.username = "Username is required";
//     if (!formData.password.trim()) newErrors.password = "Password is required";
//     if (!formData.department)
//       newErrors.department = "Please select a department";
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Handle form submit
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) return;

//     setLoading(true);
//     setErrors({});

//     try {
//       const response = await login(
//         formData.username.toLowerCase(),
//         formData.password,
//         formData.department
//       );

//       console.log(response);
      
//       if (response.success) {
//         toast.success("Login successful! Welcome back!");
//         router.push("/");
//       } else {
//         // Handle specific error cases from the login function
//         if (response.error?.includes("username") || response.error?.includes("user")) {
//           setErrors({ username: "Invalid username" });
//           toast.error("Invalid username. Please check and try again.");
//         } else if (response.error?.includes("password") || response.error?.includes("credential")) {
//           setErrors({ password: "Incorrect password" });
//           toast.error("Incorrect password. Please try again.");
//         } else if (response.error?.includes("department") || response.error?.includes("access")) {
//           setErrors({ department: "Department access denied" });
//           toast.error("You don't have access to this department.");
//         } else {
//           toast.error("Login failed. Please try again.");
//         }
//       }
//     } catch (error) {
//       console.error("Login error:", error);
      
//       // Handle different types of errors with specific messages
//       if (error.response?.status === 401) {
//         if (error.response?.data?.message?.toLowerCase().includes("password")) {
//           setErrors({ password: "Incorrect password" });
//           toast.error("Incorrect password. Please try again.");
//         } else if (error.response?.data?.message?.toLowerCase().includes("username") || 
//                    error.response?.data?.message?.toLowerCase().includes("user")) {
//           setErrors({ username: "Username not found" });
//           toast.error("Username not found. Please check and try again.");
//         } else {
//           setErrors({ general: "Invalid credentials" });
//           toast.error("Invalid username or password.");
//         }
//       } else if (error.response?.status === 403) {
//         setErrors({ department: "Access denied for this department" });
//         toast.error("You don't have permission to access this department.");
//       } else if (error.response?.status === 404) {
//         setErrors({ general: "User not found" });
//         toast.error("User account not found.");
//       } else if (error.code === 'NETWORK_ERROR' || !error.response) {
//         setErrors({ general: "Network error" });
//         toast.error("Network error. Please check your connection.");
//       } else {
//         setErrors({
//           general: error.response?.data?.message || "Login failed. Please try again."
//         });
//         toast.error(error.response?.data?.message || "Login failed. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const selectedDept = departments.find((d) => d.value === formData.department);

//   return (
//     <div className="h-screen bg-slate-50 flex overflow-hidden">
//       <Toaster/>
//       {/* Left Side */}
//       <div className="hidden lg:flex lg:flex-1 bg-slate-900 relative">
//         <div className="flex flex-col justify-center px-12 py-8 text-white w-full">
//           <div className="mb-8">
//             <div className="flex items-center space-x-4 mb-6">
//               <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
//                 <BarChart3 className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-white">
//                   SupplyChainPro
//                 </h1>
//                 <p className="text-slate-400">Business Management Platform</p>
//               </div>
//             </div>
//           </div>

//           <div className="space-y-6 mb-8">
//             <div>
//               <h3 className="text-lg font-semibold text-white mb-1">
//                 Comprehensive Business Solution
//               </h3>
//               <p className="text-slate-300 text-sm leading-relaxed">
//                 Streamline operations with integrated payroll management and
//                 task coordination.
//               </p>
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-white mb-1">
//                 Role-Based Access Control
//               </h3>
//               <p className="text-slate-300 text-sm leading-relaxed">
//                 Secure departmental access with optimized workflow management.
//               </p>
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-white mb-1">
//                 Enterprise-Grade Security
//               </h3>
//               <p className="text-slate-300 text-sm leading-relaxed">
//                 Advanced security protocols to protect your business data.
//               </p>
//             </div>
//           </div>

//           <div className="border-t border-slate-700 pt-6">
//             <p className="text-slate-400 text-sm">
//               Trusted by businesses worldwide for operational excellence.
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Right Side */}
//       <div className="flex-1 lg:flex-none lg:w-1/2 flex items-center justify-center p-6 bg-white">
//         <div className="w-full max-w-lg">
//           <div className="lg:hidden text-center mb-6">
//             <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-3">
//               <BarChart3 className="w-6 h-6 text-white" />
//             </div>
//             <h1 className="text-xl font-bold text-slate-900">SupplyChainPro</h1>
//           </div>

//           <div className="mb-6">
//             <h2 className="text-xl font-bold text-slate-900 mb-1">Sign In</h2>
//             <p className="text-slate-600 text-sm">
//               Access your business dashboard
//             </p>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             {errors.general && (
//               <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//                 <div className="flex items-center space-x-2 text-red-600">
//                   <AlertCircle className="w-4 h-4" />
//                   <span className="text-xs font-medium">{errors.general}</span>
//                 </div>
//               </div>
//             )}

//             {/* Username */}
//             <div className="space-y-1">
//               <label
//                 htmlFor="username"
//                 className="block text-xs font-medium text-slate-700"
//               >
//                 Username
//               </label>
//               <div className="relative flex items-center">
//                 <User className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
//                 <input
//                   id="username"
//                   name="username"
//                   type="text"
//                   value={formData.username}
//                   onChange={handleChange}
//                   placeholder="Enter username"
//                   className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm leading-5 focus:outline-none focus:ring-2 transition-colors ${
//                     errors.username
//                       ? "border-red-300 focus:ring-red-500 focus:border-red-500"
//                       : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
//                   }`}
//                   required
//                 />
//               </div>
//               {errors.username && (
//                 <div className="flex items-center space-x-1 text-red-600 text-xs">
//                   <AlertCircle className="w-3 h-3" />
//                   <span>{errors.username}</span>
//                 </div>
//               )}
//             </div>

//             {/* Password */}
//             <div className="space-y-1">
//               <label
//                 htmlFor="password"
//                 className="block text-xs font-medium text-slate-700"
//               >
//                 Password
//               </label>
//               <div className="relative flex items-center">
//                 <Lock className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
//                 <input
//                   id="password"
//                   name="password"
//                   type={showPassword ? "text" : "password"}
//                   value={formData.password}
//                   onChange={handleChange}
//                   placeholder="Enter password"
//                   className={`w-full pl-10 pr-11 py-2.5 border rounded-lg text-sm leading-5 focus:outline-none focus:ring-2 transition-colors ${
//                     errors.password
//                       ? "border-red-300 focus:ring-red-500 focus:border-red-500"
//                       : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
//                   }`}
//                   required
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
//                 >
//                   {showPassword ? (
//                     <EyeOff className="w-4 h-4" />
//                   ) : (
//                     <Eye className="w-4 h-4" />
//                   )}
//                 </button>
//               </div>
//               {errors.password && (
//                 <div className="flex items-center space-x-1 text-red-600 text-xs">
//                   <AlertCircle className="w-3 h-3" />
//                   <span>{errors.password}</span>
//                 </div>
//               )}
//             </div>

//             {/* Department Selection */}
//             <div className="space-y-2">
//               <label className="block text-xs font-medium text-slate-700">
//                 Department
//               </label>
//               <div className="grid grid-cols-2 gap-2">
//                 {departments.map((dept) => {
//                   const Icon = dept.icon;
//                   const isSelected = formData.department === dept.value;
//                   return (
//                     <label
//                       key={dept.value}
//                       className={`flex items-center p-2.5 border rounded-lg cursor-pointer transition-all hover:bg-slate-50 ${
//                         isSelected
//                           ? "border-yellow-300 bg-yellow-50"
//                           : "border-slate-200 bg-white"
//                       }`}
//                     >
//                       <input
//                         type="radio"
//                         name="department"
//                         value={dept.value}
//                         checked={isSelected}
//                         onChange={handleChange}
//                         className="sr-only"
//                       />
//                       <div
//                         className={`w-6 h-6 rounded flex items-center justify-center mr-2.5 ${
//                           isSelected ? "bg-yellow-100" : "bg-slate-100"
//                         }`}
//                       >
//                         <Icon
//                           className={`w-3 h-3 ${
//                             isSelected ? "text-yellow-600" : "text-slate-500"
//                           }`}
//                         />
//                       </div>
//                       <div className="flex-1">
//                         <div
//                           className={`font-medium text-xs ${
//                             isSelected ? "text-yellow-800" : "text-slate-900"
//                           }`}
//                         >
//                           {dept.label}
//                         </div>
//                         <div className="text-xs text-slate-600">
//                           {dept.fullName}
//                         </div>
//                       </div>
//                       {isSelected && (
//                         <CheckCircle className="w-4 h-4 text-yellow-600" />
//                       )}
//                     </label>
//                   );
//                 })}
//               </div>
//               {errors.department && (
//                 <div className="flex items-center space-x-1 text-red-600 text-xs">
//                   <AlertCircle className="w-3 h-3" />
//                   <span>{errors.department}</span>
//                 </div>
//               )}
//             </div>

//             {/* Submit */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                   Signing In...
//                 </>
//               ) : (
//                 <>
//                   Sign In
//                   <ArrowRight className="w-4 h-4" />
//                 </>
//               )}
//             </button>

//             <div className="text-center space-y-2 pt-2">
//               <button
//                 type="button"
//                 className="text-xs text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
//                 onClick={() =>
//                   toast.error("Contact your system administrator for password reset")
//                 }
//               >
//                 Forgot password?
//               </button>
//               <p className="text-xs text-slate-500">
//                 Contact IT support for assistance
//               </p>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import axios from "axios";
import { useSession } from "@/context/SessionContext";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  Building2,
  Shield,
  Calculator,
  Palette,
  FileText,
  Loader2,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";

export default function LoginPage() {
  const { login } = useSession();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    department: "scm",
  });

  const router = useRouter();

  const departments = [
    {
      value: "odt",
      label: "ODT",
      fullName: "Operations & Data Team",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      value: "art",
      label: "ART",
      fullName: "Analysis & Reporting Team",
      icon: Palette,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      value: "scm",
      label: "SCM",
      fullName: "Supply Chain Management",
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      value: "acc",
      label: "ACC",
      fullName: "Accounts & Finance",
      icon: Calculator,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      value: "admin",
      label: "Admin",
      fullName: "System Administrator",
      icon: Shield,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
  ];

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.password.trim()) newErrors.password = "Password is required";
    if (!formData.department)
      newErrors.department = "Please select a department";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await login(
        formData.username.toLowerCase(),
        formData.password,
        formData.department
      );

      console.log(response);
      
      if (response.success) {
        toast.success("Login successful! Welcome back!");
        router.push("/");
      } else {
        if (response.message) {
          setErrors({ general: response.message });
          toast.error(response.message);
        } else {
          toast.error("Login failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      
      if (error.response?.status === 401) {
        setErrors({ general: "Invalid credentials" });
        toast.error("Invalid username or password.");
      } else {
        setErrors({
          general: error.response?.data?.message || "Login failed. Please try again."
        });
        toast.error(error.response?.data?.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedDept = departments.find((d) => d.value === formData.department);

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      <Toaster/>
      {/* Left Side */}
      <div className="hidden lg:flex lg:flex-1 bg-slate-900 relative">
        <div className="flex flex-col justify-center px-12 py-8 text-white w-full">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  SupplyChainPro
                </h1>
                <p className="text-slate-400">Business Management Platform</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Comprehensive Business Solution
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Streamline operations with integrated payroll management and
                task coordination.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Role-Based Access Control
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Secure departmental access with optimized workflow management.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Enterprise-Grade Security
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Advanced security protocols to protect your business data.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <p className="text-slate-400 text-sm">
              Trusted by businesses worldwide for operational excellence.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1 lg:flex-none lg:w-1/2 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-lg">
          <div className="lg:hidden text-center mb-6">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">SupplyChainPro</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Sign In</h2>
            <p className="text-slate-600 text-sm">
              Access your business dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">{errors.general}</span>
                </div>
              </div>
            )}

            {/* Username */}
            <div className="space-y-1">
              <label
                htmlFor="username"
                className="block text-xs font-medium text-slate-700"
              >
                Username
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm leading-5 focus:outline-none focus:ring-2 transition-colors ${
                    errors.username
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                  }`}
                />
              </div>
              {errors.username && (
                <div className="flex items-center space-x-1 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.username}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className={`w-full pl-10 pr-11 py-2.5 border rounded-lg text-sm leading-5 focus:outline-none focus:ring-2 transition-colors ${
                    errors.password
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300 focus:ring-yellow-500 focus:border-yellow-500"
                  }`}
       
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <div className="flex items-center space-x-1 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Department Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">
                Department
              </label>
              <div className="grid grid-cols-2 gap-2">
                {departments.map((dept) => {
                  const Icon = dept.icon;
                  const isSelected = formData.department === dept.value;
                  return (
                    <label
                      key={dept.value}
                      className={`flex items-center p-2.5 border rounded-lg cursor-pointer transition-all hover:bg-slate-50 ${
                        isSelected
                          ? "border-yellow-300 bg-yellow-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="department"
                        value={dept.value}
                        checked={isSelected}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center mr-2.5 ${
                          isSelected ? "bg-yellow-100" : "bg-slate-100"
                        }`}
                      >
                        <Icon
                          className={`w-3 h-3 ${
                            isSelected ? "text-yellow-600" : "text-slate-500"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div
                          className={`font-medium text-xs ${
                            isSelected ? "text-yellow-800" : "text-slate-900"
                          }`}
                        >
                          {dept.label}
                        </div>
                        <div className="text-xs text-slate-600">
                          {dept.fullName}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 text-yellow-600" />
                      )}
                    </label>
                  );
                })}
              </div>
              {errors.department && (
                <div className="flex items-center space-x-1 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.department}</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center space-y-2 pt-2">
              <button
                type="button"
                className="text-xs text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
                onClick={() =>
                  toast.error("Contact your system administrator for password reset")
                }
              >
                Forgot password?
              </button>
              <p className="text-xs text-slate-500">
                Contact IT support for assistance
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}