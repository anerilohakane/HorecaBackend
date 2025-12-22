// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Calendar,
//   UserCheck,
//   UserX,
//   Clock,
//   CheckCircle,
//   XCircle,
//   Filter,
//   Download,
//   Upload,
//   Users,
//   BarChart3,
//   Plus,
//   Search,
//   Loader2,
//   User,
//   TrendingUp,
//   Target,
//   ChevronDown,
//   List,
// } from "lucide-react";
// import { useSession } from "@/context/SessionContext";
// import { exportToExcel } from "@/utils/exportToExcel";

// export default function AttendanceDashboard() {
//   const router = useRouter();
//   const [attendance, setAttendance] = useState([]);
//   const [selectedDate, setSelectedDate] = useState(
//     new Date().toISOString().split("T")[0]
//   );
//   const [view, setView] = useState("daily");
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [employees, setEmployees] = useState([]);
//   const [dateRange, setDateRange] = useState({
//     start: new Date(new Date().setDate(new Date().getDate() - 7)),
//     end: new Date(),
//   });
//   const [month, setMonth] = useState(new Date().getMonth());
//   const [year, setYear] = useState(new Date().getFullYear());

//   const { user } = useSession();

//   const [exportLoading, setExportLoading] = useState(false);

//   // Add these state variables after your existing states
//   const [monthlyViewMode, setMonthlyViewMode] = useState("calendar"); // 'calendar', 'list', 'analytics'
//   const [employeeFilter, setEmployeeFilter] = useState("all");

//   // Add these helper functions
//   const calculateMonthlyStats = () => {
//     const workingDays = sortedDates.length;
//     const totalPresent = attendance.filter(
//       (record) => record.status === "Present"
//     ).length;
//     const attendanceRate =
//       workingDays > 0
//         ? Math.round((totalPresent / (workingDays * employees.length)) * 100)
//         : 0;

//     // Find most consistent employee
//     const employeePerformance = calculateEmployeePerformance();
//     const mostConsistent = employeePerformance[0]?.name || "";

//     return {
//       workingDays,
//       totalPresent,
//       attendanceRate,
//       mostConsistent,
//     };
//   };

//   const handleExport = async () => {
//     try {
//       setExportLoading(true);

//       // Prepare data for export based on current view
//       let exportData = [];
//       let filename = "attendance_report";

//       if (view === "daily") {
//         filename = `daily_attendance_${selectedDate}`;
//         exportData = filteredAttendance.map((record) => ({
//           "Employee ID": record.employee?.employeeId || "N/A",
//           "Employee Name": `${
//             record.employee?.personalDetails?.firstName || ""
//           } ${record.employee?.personalDetails?.lastName || ""}`.trim(),
//           Date: new Date(record.date).toLocaleDateString(),
//           Status: record.status,
//           "Check In": record.checkIn
//             ? new Date(record.checkIn).toLocaleTimeString()
//             : "N/A",
//           "Check Out": record.checkOut
//             ? new Date(record.checkOut).toLocaleTimeString()
//             : "N/A",
//           Department: record.employee?.jobDetails?.department || "N/A",
//           Position: record.employee?.jobDetails?.position || "N/A",
//         }));
//       } else if (view === "weekly") {
//         filename = `weekly_attendance_${
//           dateRange.start.toISOString().split("T")[0]
//         }_to_${dateRange.end.toISOString().split("T")[0]}`;
//         exportData = attendance.map((record) => ({
//           "Employee ID": record.employee?.employeeId || "N/A",
//           "Employee Name": `${
//             record.employee?.personalDetails?.firstName || ""
//           } ${record.employee?.personalDetails?.lastName || ""}`.trim(),
//           Date: new Date(record.date).toLocaleDateString(),
//           Day: new Date(record.date).toLocaleDateString("en-US", {
//             weekday: "long",
//           }),
//           Status: record.status,
//           "Check In": record.checkIn
//             ? new Date(record.checkIn).toLocaleTimeString()
//             : "N/A",
//           "Check Out": record.checkOut
//             ? new Date(record.checkOut).toLocaleTimeString()
//             : "N/A",
//           Department: record.employee?.jobDetails?.department || "N/A",
//           Position: record.employee?.jobDetails?.position || "N/A",
//         }));
//       } else if (view === "monthly") {
//         filename = `monthly_attendance_${year}_${month + 1}`;

//         if (monthlyViewMode === "analytics") {
//           // Export analytics data
//           const performanceData = calculateEmployeePerformance();
//           exportData = performanceData.map((emp) => ({
//             "Employee Name": emp.name,
//             Department: emp.department,
//             "Present Days": emp.present,
//             "Total Days": emp.total,
//             "Attendance Rate": `${emp.attendanceRate}%`,
//             Rank: performanceData.indexOf(emp) + 1,
//           }));
//         } else {
//           // Export regular attendance data
//           exportData = attendance.map((record) => ({
//             "Employee ID": record.employee?.employeeId || "N/A",
//             "Employee Name": `${
//               record.employee?.personalDetails?.firstName || ""
//             } ${record.employee?.personalDetails?.lastName || ""}`.trim(),
//             Date: new Date(record.date).toLocaleDateString(),
//             Day: new Date(record.date).toLocaleDateString("en-US", {
//               weekday: "long",
//             }),
//             Status: record.status,
//             "Check In": record.checkIn
//               ? new Date(record.checkIn).toLocaleTimeString()
//               : "N/A",
//             "Check Out": record.checkOut
//               ? new Date(record.checkOut).toLocaleTimeString()
//               : "N/A",
//             Department: record.employee?.jobDetails?.department || "N/A",
//             Position: record.employee?.jobDetails?.position || "N/A",
//           }));
//         }
//       }

//       // Add summary information as separate sheets if needed
//       if (exportData.length > 0) {
//         exportToExcel(exportData, filename);
//       } else {
//         alert("No data available to export");
//       }
//     } catch (error) {
//       console.error("Error exporting data:", error);
//       alert("Error exporting data. Please try again.");
//     } finally {
//       setExportLoading(false);
//     }
//   };

//   const handleAdvancedExport = async () => {
//     try {
//       setExportLoading(true);

//       // You can add more sophisticated export logic here
//       // For example, export all data regardless of current view
//       let url = "/api/payroll/attendance/export";

//       const response = await fetch(url);
//       const data = await response.json();

//       if (data.attendance && data.attendance.length > 0) {
//         const exportData = data.attendance.map((record) => ({
//           "Employee ID": record.employee?.employeeId || "N/A",
//           "Employee Name": `${
//             record.employee?.personalDetails?.firstName || ""
//           } ${record.employee?.personalDetails?.lastName || ""}`.trim(),
//           Date: new Date(record.date).toLocaleDateString(),
//           Day: new Date(record.date).toLocaleDateString("en-US", {
//             weekday: "long",
//           }),
//           Status: record.status,
//           "Check In": record.checkIn
//             ? new Date(record.checkIn).toLocaleTimeString()
//             : "N/A",
//           "Check Out": record.checkOut
//             ? new Date(record.checkOut).toLocaleTimeString()
//             : "N/A",
//           Department: record.employee?.jobDetails?.department || "N/A",
//           Position: record.employee?.jobDetails?.position || "N/A",
//           "Late Hours": record.lateHours || "N/A",
//           Overtime: record.overtime || "N/A",
//           Remarks: record.remarks || "N/A",
//         }));

//         exportToExcel(
//           exportData,
//           `complete_attendance_${new Date().toISOString().split("T")[0]}`
//         );
//       } else {
//         alert("No attendance data available for export");
//       }
//     } catch (error) {
//       console.error("Error exporting complete data:", error);
//       alert("Error exporting data. Please try again.");
//     } finally {
//       setExportLoading(false);
//     }
//   };

//   const generateCalendarDays = () => {
//     const year = new Date().getFullYear();
//     const month = new Date().getMonth();
//     const firstDay = new Date(year, month, 1);
//     const lastDay = new Date(year, month + 1, 0);
//     const startDate = new Date(firstDay);
//     startDate.setDate(startDate.getDate() - firstDay.getDay());

//     const endDate = new Date(lastDay);
//     endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

//     const days = [];
//     const currentDate = new Date(startDate);

//     while (currentDate <= endDate) {
//       const dateStr = currentDate.toISOString().split("T")[0];
//       const attendanceRecords = groupedAttendance[dateStr] || [];

//       days.push({
//         date: new Date(currentDate),
//         isCurrentMonth: currentDate.getMonth() === month,
//         isToday: dateStr === new Date().toISOString().split("T")[0],
//         attendanceCount: attendanceRecords.length,
//         attendanceRecords: attendanceRecords,
//       });

//       currentDate.setDate(currentDate.getDate() + 1);
//     }

//     return days;
//   };

//   const calculateEmployeePerformance = () => {
//     const employeeMap = {};

//     attendance.forEach((record) => {
//       const empId = record.employee?._id;
//       if (!empId) return;

//       if (!employeeMap[empId]) {
//         employeeMap[empId] = {
//           id: empId,
//           name: `${record.employee.personalDetails?.firstName} ${record.employee.personalDetails?.lastName}`,
//           department: record.employee.jobDetails?.department || "N/A",
//           present: 0,
//           total: 0,
//         };
//       }

//       employeeMap[empId].total++;
//       if (record.status === "Present") employeeMap[empId].present++;
//     });

//     return Object.values(employeeMap)
//       .map((emp) => ({
//         ...emp,
//         attendanceRate:
//           emp.total > 0 ? Math.round((emp.present / emp.total) * 100) : 0,
//       }))
//       .sort((a, b) => b.attendanceRate - a.attendanceRate)
//       .slice(0, 10);
//   };

//   const calculateDailyTrends = () => {
//     const trends = {};

//     sortedDates.forEach((date) => {
//       const dayName = new Date(date).toLocaleDateString("en-US", {
//         weekday: "long",
//       });
//       const dayRecords = groupedAttendance[date] || [];
//       const presentCount = dayRecords.filter(
//         (r) => r.status === "Present"
//       ).length;
//       const attendanceRate =
//         employees.length > 0
//           ? Math.round((presentCount / employees.length) * 100)
//           : 0;

//       if (!trends[dayName]) {
//         trends[dayName] = {
//           date: date,
//           day: dayName,
//           total: 0,
//           present: 0,
//         };
//       }

//       trends[dayName].total++;
//       trends[dayName].present += attendanceRate;
//     });

//     return Object.values(trends).map((day) => ({
//       ...day,
//       attendanceRate: Math.round(day.present / day.total),
//     }));
//   };

//   const calculateStatusDistribution = () => {
//     const distribution = {
//       Present: 0,
//       Absent: 0,
//       Leave: 0,
//       "Half-day": 0,
//     };

//     attendance.forEach((record) => {
//       if (distribution[record.status] !== undefined) {
//         distribution[record.status]++;
//       }
//     });

//     const total = attendance.length;

//     return Object.entries(distribution).map(([name, count]) => ({
//       name,
//       count,
//       percentage: total > 0 ? Math.round((count / total) * 100) : 0,
//       color:
//         name === "Present"
//           ? "#10b981"
//           : name === "Absent"
//           ? "#ef4444"
//           : name === "Leave"
//           ? "#3b82f6"
//           : "#f59e0b",
//     }));
//   };

//   useEffect(() => {
//     fetchEmployee();
//   }, [user]);

//   useEffect(() => {
//     fetchAttendance();
//   }, [selectedDate, view, dateRange, month, year]);

//   const fetchEmployee = async () => {
//     try {
//       const response = await fetch("/api/payroll/employees");
//       const data = await response.json();

//       if (user.role === "admin") {
//         setEmployees(data.employees || []);
//       } else if (user.role === "Supervisor") {
//         const DeptEmployee = data?.employees?.filter(
//           (emp) => emp.jobDetails?.department === user?.department
//         );
//         setEmployees(DeptEmployee);
//       } else {
//         setEmployees([]);
//       }
//     } catch (error) {
//       console.error("Error fetching employees:", error);
//       setEmployees([]);
//     }
//   };

//   const fetchAttendance = async () => {
//     try {
//       setLoading(true);
//       let url = "/api/payroll/attendance";

//       // Build query parameters based on view
//       const params = new URLSearchParams();

//       if (view === "daily") {
//         params.append("date", selectedDate);
//       } else if (view === "weekly") {
//         params.append("startDate", dateRange.start.toISOString());
//         params.append("endDate", dateRange.end.toISOString());
//       } else if (view === "monthly") {
//         const startDate = new Date(year, month, 1);
//         const endDate = new Date(year, month + 1, 0);
//         params.append("startDate", startDate.toISOString());
//         params.append("endDate", endDate.toISOString());
//       }

//       const response = await fetch(`${url}?${params.toString()}`);
//       const data = await response.json();
//       setAttendance(data.attendance || []);
//     } catch (error) {
//       console.error("Error fetching attendance:", error);
//       setAttendance([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusBadge = (status) => {
//     const statusConfig = {
//       Present: {
//         color: "bg-green-50 text-green-700 border-green-200",
//         icon: CheckCircle,
//       },
//       Absent: { color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
//       "Half-day": {
//         color: "bg-yellow-50 text-yellow-700 border-yellow-200",
//         icon: Clock,
//       },
//       Leave: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: UserX },
//       Holiday: {
//         color: "bg-purple-50 text-purple-700 border-purple-200",
//         icon: Calendar,
//       },
//       Weekend: {
//         color: "bg-slate-50 text-slate-700 border-slate-200",
//         icon: Calendar,
//       },
//     };

//     const { color, icon: Icon } = statusConfig[status] || statusConfig.Absent;

//     return (
//       <span
//         className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border ${color}`}
//       >
//         <Icon className="w-3 h-3" />
//         {status}
//       </span>
//     );
//   };

//   const handleMarkAttendance = async (employeeId, status) => {
//     try {
//       const response = await fetch("/api/payroll/attendance", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           employee: employeeId,
//           date: selectedDate,
//           status,
//           checkIn: status === "Present" ? new Date() : null,
//         }),
//       });

//       if (response.ok) {
//         fetchAttendance();
//       } else {
//         const errorData = await response.json();
//         alert(errorData.error || "Failed to mark attendance");
//       }
//     } catch (error) {
//       console.error("Error marking attendance:", error);
//       alert("Error marking attendance");
//     }
//   };

//   // Calculate statistics based on current view
//   const calculateStatistics = () => {
//     if (view === "daily") {
//       const presentToday = attendance.filter(
//         (record) => record.status === "Present"
//       ).length;
//       const absentToday = attendance.filter(
//         (record) => record.status === "Absent"
//       ).length;
//       const leaveToday = attendance.filter(
//         (record) => record.status === "Leave"
//       ).length;

//       return {
//         present: presentToday,
//         absent: absentToday,
//         leave: leaveToday,
//         total: employees.length,
//       };
//     } else {
//       // For weekly and monthly views, calculate based on unique employees
//       const employeeStats = {};

//       attendance.forEach((record) => {
//         const empId = record.employee?._id;
//         if (!employeeStats[empId]) {
//           employeeStats[empId] = {
//             present: 0,
//             absent: 0,
//             leave: 0,
//             total: 0,
//           };
//         }

//         employeeStats[empId].total++;
//         if (record.status === "Present") employeeStats[empId].present++;
//         if (record.status === "Absent") employeeStats[empId].absent++;
//         if (record.status === "Leave") employeeStats[empId].leave++;
//       });

//       // Calculate averages
//       const empCount = Object.keys(employeeStats).length;
//       if (empCount === 0) return { present: 0, absent: 0, leave: 0, total: 0 };

//       const totals = Object.values(employeeStats).reduce(
//         (acc, stats) => ({
//           present: acc.present + stats.present / stats.total,
//           absent: acc.absent + stats.absent / stats.total,
//           leave: acc.leave + stats.leave / stats.total,
//         }),
//         { present: 0, absent: 0, leave: 0 }
//       );

//       return {
//         present: Math.round((totals.present / empCount) * 100),
//         absent: Math.round((totals.absent / empCount) * 100),
//         leave: Math.round((totals.leave / empCount) * 100),
//         total: empCount,
//       };
//     }
//   };

//   const stats = calculateStatistics();

//   // Group attendance by date for weekly and monthly views
//   const groupedAttendance = attendance.reduce((acc, record) => {
//     const date = new Date(record.date).toISOString().split("T")[0];
//     if (!acc[date]) {
//       acc[date] = [];
//     }
//     acc[date].push(record);
//     return acc;
//   }, {});

//   // Get unique dates sorted
//   const sortedDates = Object.keys(groupedAttendance).sort(
//     (a, b) => new Date(b) - new Date(a)
//   );

//   // Weekly date range handlers
//   const handleWeekChange = (direction) => {
//     const newStart = new Date(dateRange.start);
//     const newEnd = new Date(dateRange.end);

//     if (direction === "next") {
//       newStart.setDate(newStart.getDate() + 7);
//       newEnd.setDate(newEnd.getDate() + 7);
//     } else {
//       newStart.setDate(newStart.getDate() - 7);
//       newEnd.setDate(newEnd.getDate() - 7);
//     }

//     setDateRange({ start: newStart, end: newEnd });
//   };

//   // Monthly navigation handlers
//   const handleMonthChange = (direction) => {
//     let newMonth = month;
//     let newYear = year;

//     if (direction === "next") {
//       newMonth++;
//       if (newMonth > 11) {
//         newMonth = 0;
//         newYear++;
//       }
//     } else {
//       newMonth--;
//       if (newMonth < 0) {
//         newMonth = 11;
//         newYear--;
//       }
//     }

//     setMonth(newMonth);
//     setYear(newYear);
//   };

//   const filteredAttendance = attendance.filter((record) => {
//     const fullName =
//       `${record.employee?.personalDetails?.firstName} ${record.employee?.personalDetails?.lastName}`.toLowerCase();
//     const employeeId = record.employee?.employeeId?.toLowerCase() || "";
//     return (
//       fullName.includes(searchTerm.toLowerCase()) ||
//       employeeId.includes(searchTerm.toLowerCase())
//     );
//   });

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center">
//         <div className="flex items-center space-x-3">
//           <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
//           <span className="text-slate-600 font-medium">
//             Loading attendance data...
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
//               <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
//                 <Calendar className="w-8 h-8 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-slate-900 mb-1">
//                   Attendance Management
//                 </h1>
//                 <p className="text-slate-600">
//                   Track and manage employee attendance records
//                 </p>
//               </div>
//             </div>
//             <div className="flex gap-3">
//               <button
//                 onClick={handleExport}
//                 disabled={exportLoading}
//                 className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {exportLoading ? (
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                 ) : (
//                   <Download className="w-4 h-4" />
//                 )}
//                 {exportLoading ? "Exporting..." : "Export"}
//               </button>
//               <button
//                 onClick={() =>
//                   router.push("/payroll/attendance/add-attendance")
//                 }
//                 className="inline-flex items-center gap-2 px-4 py-2.5 text-white bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors font-medium"
//               >
//                 <Plus className="w-4 h-4" />
//                 Add Attendance
//               </button>
//             </div>
//           </div>
//         </div>
//         {/* Statistics Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
//             <div className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-slate-600">
//                     Total Employees
//                   </p>
//                   <p className="text-2xl font-bold text-slate-900">
//                     {stats.total}
//                   </p>
//                   <p className="text-xs text-slate-500 mt-1">
//                     {view === "daily"
//                       ? "Active workforce"
//                       : "Tracked employees"}
//                   </p>
//                 </div>
//                 <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
//                   <Users className="w-6 h-6 text-blue-600" />
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
//             <div className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-slate-600">
//                     {view === "daily" ? "Present Today" : "Attendance Rate"}
//                   </p>
//                   <p className="text-2xl font-bold text-green-700">
//                     {view === "daily" ? stats.present : `${stats.present}%`}
//                   </p>
//                   <p className="text-xs text-green-600 mt-1">
//                     {view === "daily"
//                       ? `${
//                           stats.total > 0
//                             ? ((stats.present / stats.total) * 100).toFixed(1)
//                             : 0
//                         }% present`
//                       : "Average attendance"}
//                   </p>
//                 </div>
//                 <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
//                   <UserCheck className="w-6 h-6 text-green-600" />
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
//             <div className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-slate-600">
//                     {view === "daily" ? "Absent Today" : "Absence Rate"}
//                   </p>
//                   <p className="text-2xl font-bold text-red-700">
//                     {view === "daily" ? stats.absent : `${stats.absent}%`}
//                   </p>
//                   <p className="text-xs text-red-600 mt-1">
//                     {view === "daily"
//                       ? `${
//                           stats.total > 0
//                             ? ((stats.absent / stats.total) * 100).toFixed(1)
//                             : 0
//                         }% absent`
//                       : "Average absence"}
//                   </p>
//                 </div>
//                 <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
//                   <UserX className="w-6 h-6 text-red-600" />
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
//             <div className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-slate-600">
//                     {view === "daily" ? "On Leave" : "Leave Rate"}
//                   </p>
//                   <p className="text-2xl font-bold text-yellow-700">
//                     {view === "daily" ? stats.leave : `${stats.leave}%`}
//                   </p>
//                   <p className="text-xs text-yellow-600 mt-1">
//                     {view === "daily"
//                       ? `${
//                           stats.total > 0
//                             ? ((stats.leave / stats.total) * 100).toFixed(1)
//                             : 0
//                         }% on leave`
//                       : "Average leave"}
//                   </p>
//                 </div>
//                 <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
//                   <Clock className="w-6 h-6 text-yellow-600" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//         {/* Navigation Tabs */}
//         <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
//           <div className="border-b border-slate-200">
//             <div className="flex space-x-8 px-6">
//               {[
//                 { id: "daily", label: "Daily View", icon: Calendar },
//                 { id: "weekly", label: "Weekly View", icon: BarChart3 },
//                 { id: "monthly", label: "Monthly Report", icon: TrendingUp },
//               ].map((tab) => (
//                 <button
//                   key={tab.id}
//                   onClick={() => setView(tab.id)}
//                   className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
//                     view === tab.id
//                       ? "border-yellow-500 text-yellow-600"
//                       : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
//                   }`}
//                 >
//                   <tab.icon className="w-4 h-4" />
//                   {tab.label}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//         {/* View Controls */}
//         <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8 p-6">
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//             <div>
//               <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
//                 <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
//                   <Calendar className="w-4 h-4 text-blue-600" />
//                 </div>
//                 {view === "daily" && "Daily Attendance"}
//                 {view === "weekly" && "Weekly Attendance"}
//                 {view === "monthly" && "Monthly Attendance"}
//               </h2>
//               <p className="text-slate-600 text-sm mt-1">
//                 {view === "daily" &&
//                   new Date(selectedDate).toLocaleDateString("en-US", {
//                     weekday: "long",
//                     year: "numeric",
//                     month: "long",
//                     day: "numeric",
//                   })}
//                 {view === "weekly" &&
//                   `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`}
//                 {view === "monthly" &&
//                   new Date(year, month).toLocaleDateString("en-US", {
//                     month: "long",
//                     year: "numeric",
//                   })}
//               </p>
//             </div>

//             <div className="flex items-center gap-4">
//               {/* Search */}
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                 <input
//                   type="text"
//                   placeholder="Search employees..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-64 pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                 />
//               </div>

//               {/* Date Controls */}
//               {view === "daily" && (
//                 <input
//                   type="date"
//                   value={selectedDate}
//                   onChange={(e) => setSelectedDate(e.target.value)}
//                   className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                 />
//               )}

//               {view === "weekly" && (
//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => handleWeekChange("prev")}
//                     className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
//                   >
//                     ←
//                   </button>
//                   <span className="text-sm text-slate-600 min-w-32 text-center">
//                     {dateRange.start.toLocaleDateString()} -{" "}
//                     {dateRange.end.toLocaleDateString()}
//                   </span>
//                   <button
//                     onClick={() => handleWeekChange("next")}
//                     className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
//                   >
//                     →
//                   </button>
//                 </div>
//               )}

//               {view === "monthly" && (
//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => handleMonthChange("prev")}
//                     className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
//                   >
//                     ←
//                   </button>
//                   <span className="text-sm text-slate-600 min-w-32 text-center">
//                     {new Date(year, month).toLocaleDateString("en-US", {
//                       month: "long",
//                       year: "numeric",
//                     })}
//                   </span>
//                   <button
//                     onClick={() => handleMonthChange("next")}
//                     className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
//                   >
//                     →
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//         {/* Daily View */}
//         {view === "daily" && (
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
//             <div className="p-6">
//               {filteredAttendance.length === 0 ? (
//                 <div className="text-center py-12">
//                   <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
//                     <Calendar className="w-8 h-8 text-slate-500" />
//                   </div>
//                   <h3 className="text-lg font-semibold text-slate-900 mb-2">
//                     No attendance records
//                   </h3>
//                   <p className="text-slate-600">
//                     No attendance has been marked for this date yet.
//                   </p>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {filteredAttendance.map((record) => (
//                     <div
//                       key={record._id}
//                       className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
//                     >
//                       <div className="flex items-center gap-4">
//                         <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
//                           <User className="w-6 h-6 text-white" />
//                         </div>
//                         <div>
//                           <h4 className="font-semibold text-slate-900">
//                             {record.employee?.personalDetails?.firstName}{" "}
//                             {record.employee?.personalDetails?.lastName}
//                           </h4>
//                           <div className="flex items-center gap-4 mt-1">
//                             <p className="text-sm text-slate-600">
//                               ID: {record.employee?.employeeId}
//                             </p>
//                             {record.checkIn && (
//                               <p className="text-sm text-slate-500">
//                                 Check-in:{" "}
//                                 {new Date(record.checkIn).toLocaleTimeString(
//                                   "en-US",
//                                   {
//                                     hour: "2-digit",
//                                     minute: "2-digit",
//                                     timeZone: "Asia/Kolkata",
//                                   }
//                                 )}
//                               </p>
//                             )}
//                             {record.checkOut && (
//                               <p className="text-sm text-slate-500">
//                                 Check-out:{" "}
//                                 {new Date(record.checkOut).toLocaleTimeString(
//                                   "en-US",
//                                   {
//                                     hour: "2-digit",
//                                     minute: "2-digit",
//                                     timeZone: "Asia/Kolkata",
//                                   }
//                                 )}
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-4">
//                         <div
//                           className={`${
//                             record.status === "Present"
//                               ? "flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm"
//                               : record.status === "Absent"
//                               ? "flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium text-sm"
//                               : "flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium text-sm"
//                           }`}
//                         >
//                           <CheckCircle className="w-4 h-4" />
//                           {record.status}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//         {/* Weekly View */}
//         {view === "weekly" && (
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
//             <div className="p-6">
//               {sortedDates.length === 0 ? (
//                 <div className="text-center py-12">
//                   <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
//                     <BarChart3 className="w-8 h-8 text-slate-500" />
//                   </div>
//                   <h3 className="text-lg font-semibold text-slate-900 mb-2">
//                     No attendance records
//                   </h3>
//                   <p className="text-slate-600">
//                     No attendance records found for this week.
//                   </p>
//                 </div>
//               ) : (
//                 <div className="space-y-6">
//                   {sortedDates.map((date) => (
//                     <div
//                       key={date}
//                       className="border border-slate-200 rounded-xl"
//                     >
//                       <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
//                         <h4 className="font-semibold text-slate-900">
//                           {new Date(date).toLocaleDateString("en-US", {
//                             weekday: "long",
//                             year: "numeric",
//                             month: "long",
//                             day: "numeric",
//                           })}
//                         </h4>
//                       </div>
//                       <div className="p-4 space-y-3">
//                         {groupedAttendance[date]
//                           .filter((record) => {
//                             const fullName =
//                               `${record.employee?.personalDetails?.firstName} ${record.employee?.personalDetails?.lastName}`.toLowerCase();
//                             const employeeId =
//                               record.employee?.employeeId?.toLowerCase() || "";
//                             return (
//                               fullName.includes(searchTerm.toLowerCase()) ||
//                               employeeId.includes(searchTerm.toLowerCase())
//                             );
//                           })
//                           .map((record) => (
//                             <div
//                               key={record._id}
//                               className="flex items-center justify-between py-2"
//                             >
//                               <div className="flex items-center gap-3">
//                                 <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                                   <User className="w-5 h-5 text-blue-600" />
//                                 </div>
//                                 <div>
//                                   <p className="font-medium text-slate-900 text-sm">
//                                     {
//                                       record.employee?.personalDetails
//                                         ?.firstName
//                                     }{" "}
//                                     {record.employee?.personalDetails?.lastName}
//                                   </p>
//                                   <p className="text-xs text-slate-500">
//                                     ID: {record.employee?.employeeId}
//                                   </p>
//                                 </div>
//                               </div>
//                               <div className="flex items-center gap-4">
//                                 {record.checkIn && (
//                                   <span className="text-xs text-slate-500">
//                                     In:{" "}
//                                     {new Date(
//                                       record.checkIn
//                                     ).toLocaleTimeString("en-US", {
//                                       hour: "2-digit",
//                                       minute: "2-digit",
//                                       timeZone: "Asia/Kolkata",
//                                     })}
//                                   </span>
//                                 )}
//                                 {getStatusBadge(record.status)}
//                               </div>
//                             </div>
//                           ))}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Monthly View */}
//         {view === "monthly" && (
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
//             <div className="p-6">
//               {/* Monthly Summary Cards */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//                 <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-medium text-slate-600">
//                         Working Days
//                       </p>
//                       <p className="text-2xl font-bold text-slate-900">
//                         {calculateMonthlyStats().workingDays}
//                       </p>
//                     </div>
//                     <Calendar className="w-8 h-8 text-slate-400" />
//                   </div>
//                 </div>
//                 <div className="bg-green-50 rounded-lg p-4 border border-green-200">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-medium text-green-600">
//                         Avg. Attendance
//                       </p>
//                       <p className="text-2xl font-bold text-green-700">
//                         {calculateMonthlyStats().attendanceRate}%
//                       </p>
//                     </div>
//                     <TrendingUp className="w-8 h-8 text-green-400" />
//                   </div>
//                 </div>
//                 <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-medium text-blue-600">
//                         Total Present
//                       </p>
//                       <p className="text-2xl font-bold text-blue-700">
//                         {calculateMonthlyStats().totalPresent}
//                       </p>
//                     </div>
//                     <UserCheck className="w-8 h-8 text-blue-400" />
//                   </div>
//                 </div>
//                 <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-medium text-amber-600">
//                         Most Consistent
//                       </p>
//                       <p className="text-lg font-bold text-amber-700 truncate">
//                         {calculateMonthlyStats().mostConsistent || "N/A"}
//                       </p>
//                     </div>
//                     <Target className="w-8 h-8 text-amber-400" />
//                   </div>
//                 </div>
//               </div>

//               {/* Calendar View Toggle */}
//               <div className="flex items-center justify-between mb-6">
//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => setMonthlyViewMode("calendar")}
//                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                       monthlyViewMode === "calendar"
//                         ? "bg-yellow-500 text-white"
//                         : "bg-slate-100 text-slate-600 hover:bg-slate-200"
//                     }`}
//                   >
//                     <Calendar className="w-4 h-4 inline mr-2" />
//                     Calendar View
//                   </button>
//                   <button
//                     onClick={() => setMonthlyViewMode("list")}
//                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                       monthlyViewMode === "list"
//                         ? "bg-yellow-500 text-white"
//                         : "bg-slate-100 text-slate-600 hover:bg-slate-200"
//                     }`}
//                   >
//                     <List className="w-4 h-4 inline mr-2" />
//                     List View
//                   </button>
//                   <button
//                     onClick={() => setMonthlyViewMode("analytics")}
//                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                       monthlyViewMode === "analytics"
//                         ? "bg-yellow-500 text-white"
//                         : "bg-slate-100 text-slate-600 hover:bg-slate-200"
//                     }`}
//                   >
//                     <BarChart3 className="w-4 h-4 inline mr-2" />
//                     Analytics
//                   </button>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <select
//                     value={employeeFilter}
//                     onChange={(e) => setEmployeeFilter(e.target.value)}
//                     className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
//                   >
//                     <option value="all">All Employees</option>
//                     {employees.map((emp) => (
//                       <option key={emp._id} value={emp._id}>
//                         {emp.personalDetails?.firstName}{" "}
//                         {emp.personalDetails?.lastName}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               {/* Calendar View */}
//               {monthlyViewMode === "calendar" && (
//                 <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
//                   <div className="grid grid-cols-7 gap-1 mb-4">
//                     {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
//                       (day) => (
//                         <div
//                           key={day}
//                           className="text-center text-sm font-medium text-slate-600 py-2"
//                         >
//                           {day}
//                         </div>
//                       )
//                     )}
//                   </div>
//                   <div className="grid grid-cols-7 gap-1">
//                     {generateCalendarDays().map((day, index) => (
//                       <div
//                         key={index}
//                         className={`min-h-24 p-2 border border-slate-200 rounded-lg ${
//                           day.isCurrentMonth ? "bg-white" : "bg-slate-100"
//                         } ${day.isToday ? "ring-2 ring-yellow-400" : ""}`}
//                       >
//                         <div className="flex justify-between items-start mb-1">
//                           <span
//                             className={`text-sm font-medium ${
//                               day.isCurrentMonth
//                                 ? "text-slate-900"
//                                 : "text-slate-400"
//                             }`}
//                           >
//                             {day.date.getDate()}
//                           </span>
//                           {day.attendanceCount > 0 && (
//                             <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">
//                               {day.attendanceCount}
//                             </span>
//                           )}
//                         </div>
//                         <div className="space-y-1">
//                           {day.attendanceRecords.slice(0, 2).map((record) => (
//                             <div
//                               key={record._id}
//                               className={`text-xs p-1 rounded ${
//                                 record.status === "Present"
//                                   ? "bg-green-100 text-green-700"
//                                   : record.status === "Absent"
//                                   ? "bg-red-100 text-red-700"
//                                   : record.status === "Leave"
//                                   ? "bg-blue-100 text-blue-700"
//                                   : "bg-yellow-100 text-yellow-700"
//                               }`}
//                             >
//                               <div className="truncate">
//                                 {record.employee?.personalDetails?.firstName?.charAt(
//                                   0
//                                 )}
//                                 .{record.employee?.personalDetails?.lastName}
//                               </div>
//                             </div>
//                           ))}
//                           {day.attendanceCount > 2 && (
//                             <div className="text-xs text-slate-500 text-center">
//                               +{day.attendanceCount - 2} more
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* List View */}
//               {monthlyViewMode === "list" && (
//                 <div className="space-y-4">
//                   {sortedDates.length === 0 ? (
//                     <div className="text-center py-12">
//                       <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
//                         <TrendingUp className="w-8 h-8 text-slate-500" />
//                       </div>
//                       <h3 className="text-lg font-semibold text-slate-900 mb-2">
//                         No attendance records
//                       </h3>
//                       <p className="text-slate-600">
//                         No attendance records found for this month.
//                       </p>
//                     </div>
//                   ) : (
//                     <div className="space-y-4">
//                       {sortedDates.map((date) => (
//                         <div
//                           key={date}
//                           className="border border-slate-200 rounded-xl"
//                         >
//                           <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
//                             <h4 className="font-semibold text-slate-900">
//                               {new Date(date).toLocaleDateString("en-US", {
//                                 weekday: "long",
//                                 year: "numeric",
//                                 month: "long",
//                                 day: "numeric",
//                               })}
//                             </h4>
//                             <div className="flex gap-2">
//                               <span className="text-sm text-slate-600">
//                                 {
//                                   groupedAttendance[date].filter(
//                                     (r) => r.status === "Present"
//                                   ).length
//                                 }{" "}
//                                 Present
//                               </span>
//                               <span className="text-sm text-slate-600">•</span>
//                               <span className="text-sm text-slate-600">
//                                 {
//                                   groupedAttendance[date].filter(
//                                     (r) => r.status === "Absent"
//                                   ).length
//                                 }{" "}
//                                 Absent
//                               </span>
//                             </div>
//                           </div>
//                           <div className="p-4">
//                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
//                               {groupedAttendance[date]
//                                 .filter((record) => {
//                                   const fullName =
//                                     `${record.employee?.personalDetails?.firstName} ${record.employee?.personalDetails?.lastName}`.toLowerCase();
//                                   const employeeId =
//                                     record.employee?.employeeId?.toLowerCase() ||
//                                     "";
//                                   const matchesSearch =
//                                     fullName.includes(
//                                       searchTerm.toLowerCase()
//                                     ) ||
//                                     employeeId.includes(
//                                       searchTerm.toLowerCase()
//                                     );
//                                   const matchesFilter =
//                                     employeeFilter === "all" ||
//                                     record.employee?._id === employeeFilter;
//                                   return matchesSearch && matchesFilter;
//                                 })
//                                 .map((record) => (
//                                   <div
//                                     key={record._id}
//                                     className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
//                                   >
//                                     <div className="flex items-center gap-3">
//                                       <div
//                                         className={`w-10 h-10 rounded-lg flex items-center justify-center ${
//                                           record.status === "Present"
//                                             ? "bg-green-100"
//                                             : record.status === "Absent"
//                                             ? "bg-red-100"
//                                             : record.status === "Leave"
//                                             ? "bg-blue-100"
//                                             : "bg-yellow-100"
//                                         }`}
//                                       >
//                                         <User
//                                           className={`w-5 h-5 ${
//                                             record.status === "Present"
//                                               ? "text-green-600"
//                                               : record.status === "Absent"
//                                               ? "text-red-600"
//                                               : record.status === "Leave"
//                                               ? "text-blue-600"
//                                               : "text-yellow-600"
//                                           }`}
//                                         />
//                                       </div>
//                                       <div>
//                                         <p className="font-medium text-slate-900 text-sm">
//                                           {
//                                             record.employee?.personalDetails
//                                               ?.firstName
//                                           }{" "}
//                                           {
//                                             record.employee?.personalDetails
//                                               ?.lastName
//                                           }
//                                         </p>
//                                         <p className="text-xs text-slate-500">
//                                           {record.employee?.employeeId}
//                                         </p>
//                                       </div>
//                                     </div>
//                                     <div className="flex flex-col items-end gap-1">
//                                       {getStatusBadge(record.status)}
//                                       {record.checkIn && (
//                                         <span className="text-xs text-slate-500">
//                                           {new Date(
//                                             record.checkIn
//                                           ).toLocaleTimeString("en-US", {
//                                             hour: "2-digit",
//                                             minute: "2-digit",
//                                           })}
//                                         </span>
//                                       )}
//                                     </div>
//                                   </div>
//                                 ))}
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* Analytics View */}
//               {monthlyViewMode === "analytics" && (
//                 <div className="space-y-6">
//                   {/* Employee Performance */}
//                   <div className="bg-white border border-slate-200 rounded-xl p-6">
//                     <h4 className="text-lg font-semibold text-slate-900 mb-4">
//                       Employee Performance
//                     </h4>
//                     <div className="space-y-3">
//                       {calculateEmployeePerformance().map((emp) => (
//                         <div
//                           key={emp.id}
//                           className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
//                         >
//                           <div className="flex items-center gap-3">
//                             <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                               <User className="w-5 h-5 text-blue-600" />
//                             </div>
//                             <div>
//                               <p className="font-medium text-slate-900">
//                                 {emp.name}
//                               </p>
//                               <p className="text-sm text-slate-500">
//                                 {emp.department}
//                               </p>
//                             </div>
//                           </div>
//                           <div className="flex items-center gap-6">
//                             <div className="text-center">
//                               <p className="text-2xl font-bold text-green-600">
//                                 {emp.attendanceRate}%
//                               </p>
//                               <p className="text-xs text-slate-500">
//                                 Attendance
//                               </p>
//                             </div>
//                             <div className="w-32 bg-slate-200 rounded-full h-2">
//                               <div
//                                 className="bg-green-500 h-2 rounded-full"
//                                 style={{ width: `${emp.attendanceRate}%` }}
//                               ></div>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>

//                   {/* Attendance Trends */}
//                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                     <div className="bg-white border border-slate-200 rounded-xl p-6">
//                       <h4 className="text-lg font-semibold text-slate-900 mb-4">
//                         Daily Attendance Trend
//                       </h4>
//                       <div className="space-y-2">
//                         {calculateDailyTrends().map((day) => (
//                           <div
//                             key={day.date}
//                             className="flex items-center justify-between"
//                           >
//                             <span className="text-sm text-slate-600 w-20">
//                               {new Date(day.date).toLocaleDateString("en-US", {
//                                 weekday: "short",
//                               })}
//                             </span>
//                             <div className="flex-1 mx-2">
//                               <div className="w-full bg-slate-200 rounded-full h-2">
//                                 <div
//                                   className="bg-blue-500 h-2 rounded-full"
//                                   style={{ width: `${day.attendanceRate}%` }}
//                                 ></div>
//                               </div>
//                             </div>
//                             <span className="text-sm font-medium text-slate-900 w-12">
//                               {day.attendanceRate}%
//                             </span>
//                           </div>
//                         ))}
//                       </div>
//                     </div>

//                     <div className="bg-white border border-slate-200 rounded-xl p-6">
//                       <h4 className="text-lg font-semibold text-slate-900 mb-4">
//                         Status Distribution
//                       </h4>
//                       <div className="space-y-3">
//                         {calculateStatusDistribution().map((status) => (
//                           <div
//                             key={status.name}
//                             className="flex items-center justify-between"
//                           >
//                             <div className="flex items-center gap-2">
//                               <div
//                                 className="w-3 h-3 rounded-full"
//                                 style={{ backgroundColor: status.color }}
//                               ></div>
//                               <span className="text-sm text-slate-700">
//                                 {status.name}
//                               </span>
//                             </div>
//                             <div className="flex items-center gap-2">
//                               <span className="text-sm font-medium text-slate-900">
//                                 {status.count} ({status.percentage}%)
//                               </span>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }



"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Upload,
  Users,
  BarChart3,
  Plus,
  Search,
  Loader2,
  User,
  TrendingUp,
  Target,
  ChevronDown,
  List,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { exportToExcel } from "@/utils/exportToExcel";

export default function AttendanceDashboard() {
  const router = useRouter();
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [view, setView] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date(),
  });
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { user } = useSession();

  const [exportLoading, setExportLoading] = useState(false);

  // Add these state variables after your existing states
  const [monthlyViewMode, setMonthlyViewMode] = useState("calendar"); // 'calendar', 'list', 'analytics'
  const [employeeFilter, setEmployeeFilter] = useState("all");

  // Add pagination helper functions
  const getPaginationData = () => {
    let dataToPaginate = [];

    if (view === "daily") {
      dataToPaginate = filteredAttendance;
    } else if (view === "weekly") {
      dataToPaginate = sortedDates;
    } else if (view === "monthly" && monthlyViewMode === "list") {
      dataToPaginate = sortedDates;
    } else if (view === "monthly" && monthlyViewMode === "analytics") {
      dataToPaginate = calculateEmployeePerformance();
    }

    const totalItems = dataToPaginate.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = dataToPaginate.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalItems),
      hasPrevious: currentPage > 1,
      hasNext: currentPage < totalPages,
    };
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const { totalPages } = getPaginationData();
    const current = currentPage;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }

    let prev = 0;
    for (const i of range) {
      if (i - prev > 1) {
        rangeWithDots.push("...");
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  };

  // Reset to page 1 when filters or view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, view, monthlyViewMode, employeeFilter, itemsPerPage]);

  // Pagination Component
  const Pagination = () => {
    const { totalPages, startIndex, endIndex, totalItems, hasPrevious, hasNext } = getPaginationData();
    
    if (totalPages <= 1) return null;

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white rounded-lg border border-slate-200">
        {/* Page info */}
        <div className="text-sm text-slate-600">
          Showing <span className="font-semibold">{startIndex}-{endIndex}</span> of <span className="font-semibold">{totalItems}</span> items
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-2">
          {/* Items per page selector */}
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-slate-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
            </select>
          </div>

          {/* Previous button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevious}
            className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) => (
              <div key={index}>
                {page === "..." ? (
                  <span className="flex items-center justify-center h-9 w-9 text-sm text-slate-500">
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                ) : (
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`h-9 w-9 flex items-center justify-center text-sm font-medium border transition-colors rounded-md ${
                      currentPage === page 
                        ? "bg-yellow-500 border-yellow-500 text-white hover:bg-yellow-600" 
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext}
            className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  // Update your existing helper functions...

  const calculateMonthlyStats = () => {
    const workingDays = sortedDates.length;
    const totalPresent = attendance.filter(
      (record) => record.status === "Present"
    ).length;
    const attendanceRate =
      workingDays > 0
        ? Math.round((totalPresent / (workingDays * employees.length)) * 100)
        : 0;

    // Find most consistent employee
    const employeePerformance = calculateEmployeePerformance();
    const mostConsistent = employeePerformance[0]?.name || "";

    return {
      workingDays,
      totalPresent,
      attendanceRate,
      mostConsistent,
    };
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);

      // Prepare data for export based on current view
      let exportData = [];
      let filename = "attendance_report";

      if (view === "daily") {
        filename = `daily_attendance_${selectedDate}`;
        exportData = filteredAttendance.map((record) => ({
          "Employee ID": record.employee?.employeeId || "N/A",
          "Employee Name": `${
            record.employee?.personalDetails?.firstName || ""
          } ${record.employee?.personalDetails?.lastName || ""}`.trim(),
          Date: new Date(record.date).toLocaleDateString(),
          Status: record.status,
          "Check In": record.checkIn
            ? new Date(record.checkIn).toLocaleTimeString()
            : "N/A",
          "Check Out": record.checkOut
            ? new Date(record.checkOut).toLocaleTimeString()
            : "N/A",
          Department: record.employee?.jobDetails?.department || "N/A",
          Position: record.employee?.jobDetails?.position || "N/A",
        }));
      } else if (view === "weekly") {
        filename = `weekly_attendance_${
          dateRange.start.toISOString().split("T")[0]
        }_to_${dateRange.end.toISOString().split("T")[0]}`;
        exportData = attendance.map((record) => ({
          "Employee ID": record.employee?.employeeId || "N/A",
          "Employee Name": `${
            record.employee?.personalDetails?.firstName || ""
          } ${record.employee?.personalDetails?.lastName || ""}`.trim(),
          Date: new Date(record.date).toLocaleDateString(),
          Day: new Date(record.date).toLocaleDateString("en-US", {
            weekday: "long",
          }),
          Status: record.status,
          "Check In": record.checkIn
            ? new Date(record.checkIn).toLocaleTimeString()
            : "N/A",
          "Check Out": record.checkOut
            ? new Date(record.checkOut).toLocaleTimeString()
            : "N/A",
          Department: record.employee?.jobDetails?.department || "N/A",
          Position: record.employee?.jobDetails?.position || "N/A",
        }));
      } else if (view === "monthly") {
        filename = `monthly_attendance_${year}_${month + 1}`;

        if (monthlyViewMode === "analytics") {
          // Export analytics data
          const performanceData = calculateEmployeePerformance();
          exportData = performanceData.map((emp) => ({
            "Employee Name": emp.name,
            Department: emp.department,
            "Present Days": emp.present,
            "Total Days": emp.total,
            "Attendance Rate": `${emp.attendanceRate}%`,
            Rank: performanceData.indexOf(emp) + 1,
          }));
        } else {
          // Export regular attendance data
          exportData = attendance.map((record) => ({
            "Employee ID": record.employee?.employeeId || "N/A",
            "Employee Name": `${
              record.employee?.personalDetails?.firstName || ""
            } ${record.employee?.personalDetails?.lastName || ""}`.trim(),
            Date: new Date(record.date).toLocaleDateString(),
            Day: new Date(record.date).toLocaleDateString("en-US", {
              weekday: "long",
            }),
            Status: record.status,
            "Check In": record.checkIn
              ? new Date(record.checkIn).toLocaleTimeString()
              : "N/A",
            "Check Out": record.checkOut
              ? new Date(record.checkOut).toLocaleTimeString()
              : "N/A",
            Department: record.employee?.jobDetails?.department || "N/A",
            Position: record.employee?.jobDetails?.position || "N/A",
          }));
        }
      }

      // Add summary information as separate sheets if needed
      if (exportData.length > 0) {
        exportToExcel(exportData, filename);
      } else {
        alert("No data available to export");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Error exporting data. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleAdvancedExport = async () => {
    try {
      setExportLoading(true);

      // You can add more sophisticated export logic here
      // For example, export all data regardless of current view
      let url = "/api/payroll/attendance/export";

      const response = await fetch(url);
      const data = await response.json();

      if (data.attendance && data.attendance.length > 0) {
        const exportData = data.attendance.map((record) => ({
          "Employee ID": record.employee?.employeeId || "N/A",
          "Employee Name": `${
            record.employee?.personalDetails?.firstName || ""
          } ${record.employee?.personalDetails?.lastName || ""}`.trim(),
          Date: new Date(record.date).toLocaleDateString(),
          Day: new Date(record.date).toLocaleDateString("en-US", {
            weekday: "long",
          }),
          Status: record.status,
          "Check In": record.checkIn
            ? new Date(record.checkIn).toLocaleTimeString()
            : "N/A",
          "Check Out": record.checkOut
            ? new Date(record.checkOut).toLocaleTimeString()
            : "N/A",
          Department: record.employee?.jobDetails?.department || "N/A",
          Position: record.employee?.jobDetails?.position || "N/A",
          "Late Hours": record.lateHours || "N/A",
          Overtime: record.overtime || "N/A",
          Remarks: record.remarks || "N/A",
        }));

        exportToExcel(
          exportData,
          `complete_attendance_${new Date().toISOString().split("T")[0]}`
        );
      } else {
        alert("No attendance data available for export");
      }
    } catch (error) {
      console.error("Error exporting complete data:", error);
      alert("Error exporting data. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const attendanceRecords = groupedAttendance[dateStr] || [];

      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: dateStr === new Date().toISOString().split("T")[0],
        attendanceCount: attendanceRecords.length,
        attendanceRecords: attendanceRecords,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const calculateEmployeePerformance = () => {
    const employeeMap = {};

    attendance.forEach((record) => {
      const empId = record.employee?._id;
      if (!empId) return;

      if (!employeeMap[empId]) {
        employeeMap[empId] = {
          id: empId,
          name: `${record.employee.personalDetails?.firstName} ${record.employee.personalDetails?.lastName}`,
          department: record.employee.jobDetails?.department || "N/A",
          present: 0,
          total: 0,
        };
      }

      employeeMap[empId].total++;
      if (record.status === "Present") employeeMap[empId].present++;
    });

    return Object.values(employeeMap)
      .map((emp) => ({
        ...emp,
        attendanceRate:
          emp.total > 0 ? Math.round((emp.present / emp.total) * 100) : 0,
      }))
      .sort((a, b) => b.attendanceRate - a.attendanceRate);
  };

  const calculateDailyTrends = () => {
    const trends = {};

    sortedDates.forEach((date) => {
      const dayName = new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
      });
      const dayRecords = groupedAttendance[date] || [];
      const presentCount = dayRecords.filter(
        (r) => r.status === "Present"
      ).length;
      const attendanceRate =
        employees.length > 0
          ? Math.round((presentCount / employees.length) * 100)
          : 0;

      if (!trends[dayName]) {
        trends[dayName] = {
          date: date,
          day: dayName,
          total: 0,
          present: 0,
        };
      }

      trends[dayName].total++;
      trends[dayName].present += attendanceRate;
    });

    return Object.values(trends).map((day) => ({
      ...day,
      attendanceRate: Math.round(day.present / day.total),
    }));
  };

  const calculateStatusDistribution = () => {
    const distribution = {
      Present: 0,
      Absent: 0,
      Leave: 0,
      "Half-day": 0,
    };

    attendance.forEach((record) => {
      if (distribution[record.status] !== undefined) {
        distribution[record.status]++;
      }
    });

    const total = attendance.length;

    return Object.entries(distribution).map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color:
        name === "Present"
          ? "#10b981"
          : name === "Absent"
          ? "#ef4444"
          : name === "Leave"
          ? "#3b82f6"
          : "#f59e0b",
    }));
  };

  useEffect(() => {
    fetchEmployee();
  }, [user]);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, view, dateRange, month, year]);

  const fetchEmployee = async () => {
    try {
      const response = await fetch("/api/payroll/employees");
      const data = await response.json();

      if (user.role === "admin") {
        setEmployees(data.employees || []);
      } else if (user.role === "Supervisor") {
        const DeptEmployee = data?.employees?.filter(
          (emp) => emp.jobDetails?.department === user?.department
        );
        setEmployees(DeptEmployee);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      let url = "/api/payroll/attendance";

      // Build query parameters based on view
      const params = new URLSearchParams();

      if (view === "daily") {
        params.append("date", selectedDate);
      } else if (view === "weekly") {
        params.append("startDate", dateRange.start.toISOString());
        params.append("endDate", dateRange.end.toISOString());
      } else if (view === "monthly") {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        params.append("startDate", startDate.toISOString());
        params.append("endDate", endDate.toISOString());
      }

      const response = await fetch(`${url}?${params.toString()}`);
      const data = await response.json();
      setAttendance(data.attendance || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Present: {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: CheckCircle,
      },
      Absent: { color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
      "Half-day": {
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: Clock,
      },
      Leave: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: UserX },
      Holiday: {
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Calendar,
      },
      Weekend: {
        color: "bg-slate-50 text-slate-700 border-slate-200",
        icon: Calendar,
      },
    };

    const { color, icon: Icon } = statusConfig[status] || statusConfig.Absent;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border ${color}`}
      >
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const handleMarkAttendance = async (employeeId, status) => {
    try {
      const response = await fetch("/api/payroll/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee: employeeId,
          date: selectedDate,
          status,
          checkIn: status === "Present" ? new Date() : null,
        }),
      });

      if (response.ok) {
        fetchAttendance();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to mark attendance");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("Error marking attendance");
    }
  };

  // Calculate statistics based on current view
  const calculateStatistics = () => {
    if (view === "daily") {
      const presentToday = attendance.filter(
        (record) => record.status === "Present"
      ).length;
      const absentToday = attendance.filter(
        (record) => record.status === "Absent"
      ).length;
      const leaveToday = attendance.filter(
        (record) => record.status === "Leave"
      ).length;

      return {
        present: presentToday,
        absent: absentToday,
        leave: leaveToday,
        total: employees.length,
      };
    } else {
      // For weekly and monthly views, calculate based on unique employees
      const employeeStats = {};

      attendance.forEach((record) => {
        const empId = record.employee?._id;
        if (!employeeStats[empId]) {
          employeeStats[empId] = {
            present: 0,
            absent: 0,
            leave: 0,
            total: 0,
          };
        }

        employeeStats[empId].total++;
        if (record.status === "Present") employeeStats[empId].present++;
        if (record.status === "Absent") employeeStats[empId].absent++;
        if (record.status === "Leave") employeeStats[empId].leave++;
      });

      // Calculate averages
      const empCount = Object.keys(employeeStats).length;
      if (empCount === 0) return { present: 0, absent: 0, leave: 0, total: 0 };

      const totals = Object.values(employeeStats).reduce(
        (acc, stats) => ({
          present: acc.present + stats.present / stats.total,
          absent: acc.absent + stats.absent / stats.total,
          leave: acc.leave + stats.leave / stats.total,
        }),
        { present: 0, absent: 0, leave: 0 }
      );

      return {
        present: Math.round((totals.present / empCount) * 100),
        absent: Math.round((totals.absent / empCount) * 100),
        leave: Math.round((totals.leave / empCount) * 100),
        total: empCount,
      };
    }
  };

  const stats = calculateStatistics();

  // Group attendance by date for weekly and monthly views
  const groupedAttendance = attendance.reduce((acc, record) => {
    const date = new Date(record.date).toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {});

  // Get unique dates sorted
  const sortedDates = Object.keys(groupedAttendance).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  // Weekly date range handlers
  const handleWeekChange = (direction) => {
    const newStart = new Date(dateRange.start);
    const newEnd = new Date(dateRange.end);

    if (direction === "next") {
      newStart.setDate(newStart.getDate() + 7);
      newEnd.setDate(newEnd.getDate() + 7);
    } else {
      newStart.setDate(newStart.getDate() - 7);
      newEnd.setDate(newEnd.getDate() - 7);
    }

    setDateRange({ start: newStart, end: newEnd });
  };

  // Monthly navigation handlers
  const handleMonthChange = (direction) => {
    let newMonth = month;
    let newYear = year;

    if (direction === "next") {
      newMonth++;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
    } else {
      newMonth--;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
    }

    setMonth(newMonth);
    setYear(newYear);
  };

  const filteredAttendance = attendance.filter((record) => {
    const fullName =
      `${record.employee?.personalDetails?.firstName} ${record.employee?.personalDetails?.lastName}`.toLowerCase();
    const employeeId = record.employee?.employeeId?.toLowerCase() || "";
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      employeeId.includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          <span className="text-slate-600 font-medium">
            Loading attendance data...
          </span>
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
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  Attendance Management
                </h1>
                <p className="text-slate-600">
                  Track and manage employee attendance records
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exportLoading ? "Exporting..." : "Export"}
              </button>
              <button
                onClick={() =>
                  router.push("/payroll/attendance/add-attendance")
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 text-white bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Attendance
              </button>
            </div>
          </div>
        </div>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Total Employees
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.total}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {view === "daily"
                      ? "Active workforce"
                      : "Tracked employees"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {view === "daily" ? "Present Today" : "Attendance Rate"}
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {view === "daily" ? stats.present : `${stats.present}%`}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {view === "daily"
                      ? `${
                          stats.total > 0
                            ? ((stats.present / stats.total) * 100).toFixed(1)
                            : 0
                        }% present`
                      : "Average attendance"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {view === "daily" ? "Absent Today" : "Absence Rate"}
                  </p>
                  <p className="text-2xl font-bold text-red-700">
                    {view === "daily" ? stats.absent : `${stats.absent}%`}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {view === "daily"
                      ? `${
                          stats.total > 0
                            ? ((stats.absent / stats.total) * 100).toFixed(1)
                            : 0
                        }% absent`
                      : "Average absence"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <UserX className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {view === "daily" ? "On Leave" : "Leave Rate"}
                  </p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {view === "daily" ? stats.leave : `${stats.leave}%`}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {view === "daily"
                      ? `${
                          stats.total > 0
                            ? ((stats.leave / stats.total) * 100).toFixed(1)
                            : 0
                        }% on leave`
                      : "Average leave"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
          <div className="border-b border-slate-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: "daily", label: "Daily View", icon: Calendar },
                { id: "weekly", label: "Weekly View", icon: BarChart3 },
                { id: "monthly", label: "Monthly Report", icon: TrendingUp },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                    view === tab.id
                      ? "border-yellow-500 text-yellow-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* View Controls */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                {view === "daily" && "Daily Attendance"}
                {view === "weekly" && "Weekly Attendance"}
                {view === "monthly" && "Monthly Attendance"}
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                {view === "daily" &&
                  new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                {view === "weekly" &&
                  `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`}
                {view === "monthly" &&
                  new Date(year, month).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
              </div>

              {/* Date Controls */}
              {view === "daily" && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
              )}

              {view === "weekly" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleWeekChange("prev")}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    ←
                  </button>
                  <span className="text-sm text-slate-600 min-w-32 text-center">
                    {dateRange.start.toLocaleDateString()} -{" "}
                    {dateRange.end.toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleWeekChange("next")}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    →
                  </button>
                </div>
              )}

              {view === "monthly" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMonthChange("prev")}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    ←
                  </button>
                  <span className="text-sm text-slate-600 min-w-32 text-center">
                    {new Date(year, month).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={() => handleMonthChange("next")}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Daily View */}
        {view === "daily" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              {filteredAttendance.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No attendance records
                  </h3>
                  <p className="text-slate-600">
                    No attendance has been marked for this date yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getPaginationData().currentItems.map((record) => (
                    <div
                      key={record._id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {record.employee?.personalDetails?.firstName}{" "}
                            {record.employee?.personalDetails?.lastName}
                          </h4>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm text-slate-600">
                              ID: {record.employee?.employeeId}
                            </p>
                            {record.checkIn && (
                              <p className="text-sm text-slate-500">
                                Check-in:{" "}
                                {new Date(record.checkIn).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    timeZone: "Asia/Kolkata",
                                  }
                                )}
                              </p>
                            )}
                            {record.checkOut && (
                              <p className="text-sm text-slate-500">
                                Check-out:{" "}
                                {new Date(record.checkOut).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    timeZone: "Asia/Kolkata",
                                  }
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className={`${
                            record.status === "Present"
                              ? "flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm"
                              : record.status === "Absent"
                              ? "flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium text-sm"
                              : "flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium text-sm"
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {record.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Pagination />
            </div>
          </div>
        )}
        {/* Weekly View */}
        {view === "weekly" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              {sortedDates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No attendance records
                  </h3>
                  <p className="text-slate-600">
                    No attendance records found for this week.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {getPaginationData().currentItems.map((date) => (
                    <div
                      key={date}
                      className="border border-slate-200 rounded-xl"
                    >
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <h4 className="font-semibold text-slate-900">
                          {new Date(date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </h4>
                      </div>
                      <div className="p-4 space-y-3">
                        {groupedAttendance[date]
                          .filter((record) => {
                            const fullName =
                              `${record.employee?.personalDetails?.firstName} ${record.employee?.personalDetails?.lastName}`.toLowerCase();
                            const employeeId =
                              record.employee?.employeeId?.toLowerCase() || "";
                            return (
                              fullName.includes(searchTerm.toLowerCase()) ||
                              employeeId.includes(searchTerm.toLowerCase())
                            );
                          })
                          .map((record) => (
                            <div
                              key={record._id}
                              className="flex items-center justify-between py-2"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900 text-sm">
                                    {
                                      record.employee?.personalDetails
                                        ?.firstName
                                    }{" "}
                                    {record.employee?.personalDetails?.lastName}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    ID: {record.employee?.employeeId}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {record.checkIn && (
                                  <span className="text-xs text-slate-500">
                                    In:{" "}
                                    {new Date(
                                      record.checkIn
                                    ).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      timeZone: "Asia/Kolkata",
                                    })}
                                  </span>
                                )}
                                {getStatusBadge(record.status)}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Pagination />
            </div>
          </div>
        )}

        {/* Monthly View */}
        {view === "monthly" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              {/* Monthly Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        Working Days
                      </p>
                      <p className="text-2xl font-bold text-slate-900">
                        {calculateMonthlyStats().workingDays}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">
                        Avg. Attendance
                      </p>
                      <p className="text-2xl font-bold text-green-700">
                        {calculateMonthlyStats().attendanceRate}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        Total Present
                      </p>
                      <p className="text-2xl font-bold text-blue-700">
                        {calculateMonthlyStats().totalPresent}
                      </p>
                    </div>
                    <UserCheck className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-600">
                        Most Consistent
                      </p>
                      <p className="text-lg font-bold text-amber-700 truncate">
                        {calculateMonthlyStats().mostConsistent || "N/A"}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-amber-400" />
                  </div>
                </div>
              </div>

              {/* Calendar View Toggle */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMonthlyViewMode("calendar")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      monthlyViewMode === "calendar"
                        ? "bg-yellow-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Calendar View
                  </button>
                  <button
                    onClick={() => setMonthlyViewMode("list")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      monthlyViewMode === "list"
                        ? "bg-yellow-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <List className="w-4 h-4 inline mr-2" />
                    List View
                  </button>
                  <button
                    onClick={() => setMonthlyViewMode("analytics")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      monthlyViewMode === "analytics"
                        ? "bg-yellow-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Analytics
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="all">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.personalDetails?.firstName}{" "}
                        {emp.personalDetails?.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Calendar View */}
              {monthlyViewMode === "calendar" && (
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div
                          key={day}
                          className="text-center text-sm font-medium text-slate-600 py-2"
                        >
                          {day}
                        </div>
                      )
                    )}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays().map((day, index) => (
                      <div
                        key={index}
                        className={`min-h-24 p-2 border border-slate-200 rounded-lg ${
                          day.isCurrentMonth ? "bg-white" : "bg-slate-100"
                        } ${day.isToday ? "ring-2 ring-yellow-400" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span
                            className={`text-sm font-medium ${
                              day.isCurrentMonth
                                ? "text-slate-900"
                                : "text-slate-400"
                            }`}
                          >
                            {day.date.getDate()}
                          </span>
                          {day.attendanceCount > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">
                              {day.attendanceCount}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {day.attendanceRecords.slice(0, 2).map((record) => (
                            <div
                              key={record._id}
                              className={`text-xs p-1 rounded ${
                                record.status === "Present"
                                  ? "bg-green-100 text-green-700"
                                  : record.status === "Absent"
                                  ? "bg-red-100 text-red-700"
                                  : record.status === "Leave"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              <div className="truncate">
                                {record.employee?.personalDetails?.firstName?.charAt(
                                  0
                                )}
                                .{record.employee?.personalDetails?.lastName}
                              </div>
                            </div>
                          ))}
                          {day.attendanceCount > 2 && (
                            <div className="text-xs text-slate-500 text-center">
                              +{day.attendanceCount - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* List View */}
              {monthlyViewMode === "list" && (
                <div className="space-y-4">
                  {sortedDates.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-slate-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        No attendance records
                      </h3>
                      <p className="text-slate-600">
                        No attendance records found for this month.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getPaginationData().currentItems.map((date) => (
                        <div
                          key={date}
                          className="border border-slate-200 rounded-xl"
                        >
                          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                            <h4 className="font-semibold text-slate-900">
                              {new Date(date).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </h4>
                            <div className="flex gap-2">
                              <span className="text-sm text-slate-600">
                                {
                                  groupedAttendance[date].filter(
                                    (r) => r.status === "Present"
                                  ).length
                                }{" "}
                                Present
                              </span>
                              <span className="text-sm text-slate-600">•</span>
                              <span className="text-sm text-slate-600">
                                {
                                  groupedAttendance[date].filter(
                                    (r) => r.status === "Absent"
                                  ).length
                                }{" "}
                                Absent
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {groupedAttendance[date]
                                .filter((record) => {
                                  const fullName =
                                    `${record.employee?.personalDetails?.firstName} ${record.employee?.personalDetails?.lastName}`.toLowerCase();
                                  const employeeId =
                                    record.employee?.employeeId?.toLowerCase() ||
                                    "";
                                  const matchesSearch =
                                    fullName.includes(
                                      searchTerm.toLowerCase()
                                    ) ||
                                    employeeId.includes(
                                      searchTerm.toLowerCase()
                                    );
                                  const matchesFilter =
                                    employeeFilter === "all" ||
                                    record.employee?._id === employeeFilter;
                                  return matchesSearch && matchesFilter;
                                })
                                .map((record) => (
                                  <div
                                    key={record._id}
                                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                          record.status === "Present"
                                            ? "bg-green-100"
                                            : record.status === "Absent"
                                            ? "bg-red-100"
                                            : record.status === "Leave"
                                            ? "bg-blue-100"
                                            : "bg-yellow-100"
                                        }`}
                                      >
                                        <User
                                          className={`w-5 h-5 ${
                                            record.status === "Present"
                                              ? "text-green-600"
                                              : record.status === "Absent"
                                              ? "text-red-600"
                                              : record.status === "Leave"
                                              ? "text-blue-600"
                                              : "text-yellow-600"
                                          }`}
                                        />
                                      </div>
                                      <div>
                                        <p className="font-medium text-slate-900 text-sm">
                                          {
                                            record.employee?.personalDetails
                                              ?.firstName
                                          }{" "}
                                          {
                                            record.employee?.personalDetails
                                              ?.lastName
                                          }
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          {record.employee?.employeeId}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      {getStatusBadge(record.status)}
                                      {record.checkIn && (
                                        <span className="text-xs text-slate-500">
                                          {new Date(
                                            record.checkIn
                                          ).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Pagination />
                </div>
              )}

              {/* Analytics View */}
              {monthlyViewMode === "analytics" && (
                <div className="space-y-6">
                  {/* Employee Performance */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">
                      Employee Performance
                    </h4>
                    <div className="space-y-3">
                      {getPaginationData().currentItems.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {emp.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {emp.department}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">
                                {emp.attendanceRate}%
                              </p>
                              <p className="text-xs text-slate-500">
                                Attendance
                              </p>
                            </div>
                            <div className="w-32 bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${emp.attendanceRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Pagination />
                  </div>

                  {/* Attendance Trends */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">
                        Daily Attendance Trend
                      </h4>
                      <div className="space-y-2">
                        {calculateDailyTrends().map((day) => (
                          <div
                            key={day.date}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm text-slate-600 w-20">
                              {new Date(day.date).toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </span>
                            <div className="flex-1 mx-2">
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${day.attendanceRate}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-slate-900 w-12">
                              {day.attendanceRate}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">
                        Status Distribution
                      </h4>
                      <div className="space-y-3">
                        {calculateStatusDistribution().map((status) => (
                          <div
                            key={status.name}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: status.color }}
                              ></div>
                              <span className="text-sm text-slate-700">
                                {status.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-900">
                                {status.count} ({status.percentage}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}