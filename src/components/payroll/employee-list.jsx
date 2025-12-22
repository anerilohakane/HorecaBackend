  // 'use client';

  // import { useState, useEffect } from 'react';
  // import {
  //   Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, Users, Calendar,
  //   Building, TrendingUp, Grid3X3, List, ChevronDown, Briefcase, RefreshCw, X,
  //   Truck, Warehouse, Package, BarChart3, Settings, Bell, MapPin, Phone, Mail,
  //   FilterX, AlertCircle, CheckCircle,
  //   Download
  // } from 'lucide-react';
  // import { exportToExcel } from '@/utils/exportToExcel';

  // export default function EmployeeList() {
  //  const [employees, setEmployees] = useState([]);
  // const [loading, setLoading] = useState(true);
  // const [refreshing, setRefreshing] = useState(false);
  // const [searchTerm, setSearchTerm] = useState('');
  // const [departmentFilter, setDepartmentFilter] = useState('');
  // const [statusFilter, setStatusFilter] = useState('');
  // const [viewMode, setViewMode] = useState('grid');
  // const [selectedEmployees, setSelectedEmployees] = useState([]);
  // const [error, setError] = useState(null);
  // const [exportLoading, setExportLoading] = useState(false);

  //   useEffect(() => {
  //     fetchEmployees();
  //   }, [searchTerm, departmentFilter, statusFilter]);

  //   const fetchEmployees = async () => {
  //     try {
  //       setLoading(!employees.length);
  //       setRefreshing(employees.length > 0);
  //       setError(null);
        
  //       const params = new URLSearchParams();
  //       if (searchTerm) params.append('search', searchTerm);
  //       if (departmentFilter) params.append('department', departmentFilter);
  //       if (statusFilter) params.append('status', statusFilter);
        
  //       const response = await fetch(`/api/payroll/employees?${params}`);
  //       const data = await response.json();
        
  //       if (response.ok) {
  //         setEmployees(data.employees || []);
  //       } else {
  //         setError(data.error || 'Failed to fetch employees');
  //         console.error('Failed to fetch employees:', data.error);
  //       }
  //     } catch (error) {
  //       setError('Network error occurred while fetching data');
  //       console.error('Error fetching employees:', error);
  //     } finally {
  //       setLoading(false);
  //       setRefreshing(false);
  //     }
  //   };


  //    // Export functionality
  // const handleExport = async () => {
  //   try {
  //     setExportLoading(true);
      
  //     // Prepare data for export
  //     const exportData = employees.map(employee => ({
  //       'Employee ID': employee.employeeId || 'N/A',
  //       'First Name': employee.personalDetails?.firstName || 'N/A',
  //       'Last Name': employee.personalDetails?.lastName || 'N/A',
  //       'Full Name': `${employee.personalDetails?.firstName || ''} ${employee.personalDetails?.lastName || ''}`.trim(),
  //       'Email': employee.personalDetails?.email || 'N/A',
  //       'DOB': employee.personalDetails?.dateOfBirth ? new Date(employee.personalDetails.dateOfBirth).toLocaleDateString() : 'N/A',
  //       'Phone': employee.personalDetails?.phone || 'N/A',
  //       'Department': employee.jobDetails?.department || 'N/A',
  //       'Designation': employee.jobDetails?.designation || 'N/A',
  //       'Work Location': employee.jobDetails?.workLocation || 'N/A',
  //       'Employment Type': employee.jobDetails?.employmentType || 'N/A',
  //       'Salary': employee.salaryDetails?.basicSalary ? `$${employee.salaryDetails.basicSalary.toLocaleString()}` : 'N/A',
  //       'Status': employee.status || 'N/A',
  //       'Join Date': employee.personalDetails?.dateOfJoining ? 
  //         new Date(employee.personalDetails.dateOfJoining).toLocaleDateString() : 'N/A',
  //       'Address': employee.personalDetails?.address ? 
  //         `${employee.personalDetails.address.street || ''}, ${employee.personalDetails.address.city || ''}, ${employee.personalDetails.address.state || ''}, ${employee.personalDetails.address.zipCode || ''}`.trim() : 'N/A'
  //     }));

  //     if (exportData.length > 0) {
  //       exportToExcel(exportData, 'employee_directory');
  //     } else {
  //       alert('No employee data available to export');
  //     }

  //   } catch (error) {
  //     console.error('Export error:', error);
  //     alert('Error exporting employee data. Please try again.');
  //   } finally {
  //     setExportLoading(false);
  //   }
  // };

  // // Export filtered data only
  // const handleExportFiltered = async () => {
  //   try {
  //     setExportLoading(true);
      
  //     const exportData = employees.map(employee => ({
  //       'Employee ID': employee.employeeId || 'N/A',
  //       'Full Name': `${employee.personalDetails?.firstName || ''} ${employee.personalDetails?.lastName || ''}`.trim(),
  //       'Department': employee.jobDetails?.department || 'N/A',
  //       'Designation': employee.jobDetails?.designation || 'N/A',
  //       'Position': employee.jobDetails?.position || 'N/A',
  //       'Status': employee.status || 'N/A',
  //       'Join Date': employee.personalDetails?.dateOfJoining ? 
  //         new Date(employee.personalDetails.dateOfJoining).toLocaleDateString() : 'N/A',
  //       'Email': employee.personalDetails?.email || 'N/A',
  //       'Phone': employee.personalDetails?.phone || 'N/A'
  //     }));

  //     if (exportData.length > 0) {
  //       let filename = 'employees';
  //       if (searchTerm) filename += `_search_${searchTerm}`;
  //       if (departmentFilter) filename += `_dept_${departmentFilter}`;
  //       if (statusFilter) filename += `_status_${statusFilter}`;
        
  //       exportToExcel(exportData, filename);
  //     } else {
  //       alert('No filtered employee data available to export');
  //     }

  //   } catch (error) {
  //     console.error('Export filtered error:', error);
  //     alert('Error exporting filtered data. Please try again.');
  //   } finally {
  //     setExportLoading(false);
  //   }
  // };


  //   const handleDelete = async (id) => {
  //     if (!confirm('Are you sure you want to delete this employee?')) return;
      
  //     try {
  //       const response = await fetch(`/api/payroll/employees/${id}`, {
  //         method: 'DELETE',
  //       });
        
  //       if (response.ok) {
  //         setEmployees(employees.filter(emp => emp._id !== id));
  //       } else {
  //         const data = await response.json();
  //         alert(`Error: ${data.error}`);
  //       }
  //     } catch (error) {
  //       console.error('Error deleting employee:', error);
  //       alert('An error occurred while deleting employee');
  //     }
  //   };

  //   const getStatusConfig = (status) => {
  //     const statusConfig = {
  //       Active: { 
  //         bg: 'bg-green-50', 
  //         text: 'text-green-700', 
  //         border: 'border-green-200',
  //         dot: 'bg-green-500'
  //       },
  //       Inactive: { 
  //         bg: 'bg-slate-50', 
  //         text: 'text-slate-700', 
  //         border: 'border-slate-200',
  //         dot: 'bg-slate-500'
  //       },
  //       Suspended: { 
  //         bg: 'bg-amber-50', 
  //         text: 'text-amber-700', 
  //         border: 'border-amber-200',
  //         dot: 'bg-amber-500'
  //       },
  //       Terminated: { 
  //         bg: 'bg-red-50', 
  //         text: 'text-red-700', 
  //         border: 'border-red-200',
  //         dot: 'bg-red-500'
  //       },
  //     };
  //     return statusConfig[status] || statusConfig.Inactive;
  //   };

  //   const getStatusBadge = (status) => {
  //     const config = getStatusConfig(status);
      
  //     return (
  //       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
  //         <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
  //         {status}
  //       </span>
  //     );
  //   };

  //   const getInitials = (firstName, lastName) => {
  //     return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  //   };

  //   const getDepartmentIcon = (department) => {
  //     const icons = {
  //       Logistics: Truck,
  //       Warehouse: Warehouse,
  //       Procurement: Package,
  //       Inventory: BarChart3,
  //       Distribution: MapPin,
  //       Operations: Settings,
  //       Planning: Calendar
  //     };
  //     return icons[department] || Building;
  //   };

  //   // Extract unique departments and statuses from fetched data
  //   const departments = [...new Set(employees.map(emp => emp.jobDetails?.department).filter(Boolean))];
  //   const statuses = [...new Set(employees.map(emp => emp.status).filter(Boolean))];

  //   const hasActiveFilters = searchTerm || departmentFilter || statusFilter;

  //   if (loading) {
  //     return (
  //       <div className="min-h-screen bg-slate-50">
  //         <div className="flex items-center justify-center h-screen">
  //           <div className="text-center space-y-4">
  //             <div className="w-12 h-12 border-4 border-slate-200 border-t-yellow-500 rounded-full animate-spin mx-auto"></div>
  //             <div>
  //               <h3 className="text-lg font-semibold text-slate-900">Loading Employee Directory</h3>
  //               <p className="text-sm text-slate-600 mt-1">Please wait while we fetch your team data...</p>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     );
  //   }

  //   return (
  //     <div className="min-h-screen bg-slate-50">
  //       {/* Header */}
  //       <div className="bg-white border-b border-slate-200">
  //         <div className="max-w-7xl mx-auto px-6 py-6">
  //           <div className="flex items-center justify-between">
  //             <div className="flex items-center space-x-4">
  //               <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
  //                 <Users className="w-6 h-6 text-white" />
  //               </div>
  //               <div>
  //                 <h1 className="text-2xl font-bold text-slate-900">Employee Directory</h1>
  //                 <p className="text-slate-600 text-sm mt-0.5">Manage your supply chain workforce and team operations</p>
  //               </div>
  //             </div>
              
  //             <div className="flex items-center space-x-2">
  //                <button
  //               onClick={handleExport}
  //               disabled={exportLoading || employees.length === 0}
  //               className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
  //             >
  //               {exportLoading ? (
  //                 <Loader2 className="w-4 h-4 animate-spin" />
  //               ) : (
  //                 <Download className="w-4 h-4" />
  //               )}
  //               {exportLoading ? "Exporting..." : "Export"}
  //             </button>

  //              <a
  //                   href="/payroll/employees/new"
  //                   className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors shadow-sm"
  //                 >
  //                   <Plus className="w-4 h-4" />
  //                   Add Employee
  //                 </a>
  //             </div>
  //           </div>
  //         </div>
  //       </div>

  //       <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
  //         {/* Analytics Overview */}
  //         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  //           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
  //             <div className="flex items-center justify-between">
  //               <div>
  //                 <p className="text-sm font-medium text-slate-600">Total Employees</p>
  //                 <p className="text-2xl font-bold text-slate-900 mt-2">{employees.length}</p>
  //                 <p className="text-xs text-slate-500 mt-1">Active workforce</p>
  //               </div>
  //               <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100">
  //                 <Users className="w-6 h-6 text-yellow-600" />
  //               </div>
  //             </div>
  //           </div>
            
  //           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
  //             <div className="flex items-center justify-between">
  //               <div>
  //                 <p className="text-sm font-medium text-slate-600">Active Staff</p>
  //                 <p className="text-2xl font-bold text-slate-900 mt-2">
  //                   {employees.filter(e => e.status === 'Active').length}
  //                 </p>
  //                 <p className="text-xs text-slate-500 mt-1">Currently working</p>
  //               </div>
  //               <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
  //                 <CheckCircle className="w-6 h-6 text-green-600" />
  //               </div>
  //             </div>
  //           </div>
            
  //           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
  //             <div className="flex items-center justify-between">
  //               <div>
  //                 <p className="text-sm font-medium text-slate-600">Departments</p>
  //                 <p className="text-2xl font-bold text-slate-900 mt-2">
  //                   {new Set(employees.map(e => e.jobDetails?.department).filter(Boolean)).size}
  //                 </p>
  //                 <p className="text-xs text-slate-500 mt-1">Business units</p>
  //               </div>
  //               <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
  //                 <Building className="w-6 h-6 text-blue-600" />
  //               </div>
  //             </div>
  //           </div>
            
  //           {/* <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
  //             <div className="flex items-center justify-between">
  //               <div>
  //                 <p className="text-sm font-medium text-slate-600">New Hires</p>
  //                 <p className="text-2xl font-bold text-slate-900 mt-2">
  //                   {employees.filter(e => {
  //                     const joinDate = new Date(e.personalDetails?.dateOfJoining);
  //                     const currentDate = new Date();
  //                     return joinDate.getMonth() === currentDate.getMonth() && 
  //                           joinDate.getFullYear() === currentDate.getFullYear();
  //                   }).length}
  //                 </p>
  //                 <p className="text-xs text-slate-500 mt-1">This month</p>
  //               </div>
  //               <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
  //                 <TrendingUp className="w-6 h-6 text-purple-600" />
  //               </div>
  //             </div>
  //           </div> */}
  //         </div>

  //         {/* Controls Panel */}
  //         <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
  //           <div className="p-6 border-b border-slate-200">
  //             <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
  //               <div className="flex items-center space-x-3">
  //                 <h2 className="text-xl font-semibold text-slate-900">Team Directory ({employees.length})</h2>
  //                 {hasActiveFilters && (
  //                   <span className="inline-flex items-center px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
  //                     Filtered Results
  //                   </span>
  //                 )}
  //               </div>
                
  //               <div className="flex items-center space-x-3">
  //                 <button
  //                   onClick={fetchEmployees}
  //                   disabled={refreshing}
  //                   className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 disabled:opacity-50 transition-colors font-medium"
  //                 >
  //                   <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
  //                   Refresh
  //                 </button>

  //                 {hasActiveFilters && (
  //                 <button
  //                   onClick={handleExportFiltered}
  //                   disabled={exportLoading || employees.length === 0}
  //                   className="inline-flex items-center gap-2 px-4 py-2.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
  //                 >
  //                   {exportLoading ? (
  //                     <Loader2 className="w-4 h-4 animate-spin" />
  //                   ) : (
  //                     <Download className="w-4 h-4" />
  //                   )}
  //                   {exportLoading ? "Exporting..." : "Export Filtered"}
  //                 </button>
  //               )}
                
                  
  //                 <div className="flex bg-slate-100 rounded-lg p-1">
  //                   <button
  //                     onClick={() => setViewMode('grid')}
  //                     className={`p-2 rounded-md transition-all duration-200 ${
  //                       viewMode === 'grid' ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-500 hover:text-slate-700'
  //                     }`}
  //                     title="Grid view"
  //                   >
  //                     <Grid3X3 className="w-4 h-4" />
  //                   </button>
  //                   <button
  //                     onClick={() => setViewMode('table')}
  //                     className={`p-2 rounded-md transition-all duration-200 ${
  //                       viewMode === 'table' ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-500 hover:text-slate-700'
  //                     }`}
  //                     title="Table view"
  //                   >
  //                     <List className="w-4 h-4" />
  //                   </button>
  //                 </div>
  //               </div>
  //             </div>

  //             {/* Search and Filters */}
  //             <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
  //               <div className="lg:col-span-6">
  //                 <label className="block text-sm font-medium text-slate-700 mb-2">Search Employees</label>
  //                 <div className="relative">
  //                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
  //                   <input
  //                     type="text"
  //                     placeholder="Search by name, ID, or department..."
  //                     value={searchTerm}
  //                     onChange={(e) => setSearchTerm(e.target.value)}
  //                     className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
  //                   />
  //                 </div>
  //               </div>
                
  //               <div className="lg:col-span-2">
  //                 <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
  //                 <select
  //                   value={departmentFilter}
  //                   onChange={(e) => setDepartmentFilter(e.target.value)}
  //                   className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
  //                 >
  //                   <option value="">All Departments</option>
  //                   {departments.map(dept => (
  //                     <option key={dept} value={dept}>{dept}</option>
  //                   ))}
  //                 </select>
  //               </div>
                
  //               <div className="lg:col-span-2">
  //                 <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
  //                 <select
  //                   value={statusFilter}
  //                   onChange={(e) => setStatusFilter(e.target.value)}
  //                   className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
  //                 >
  //                   <option value="">All Status</option>
  //                   {statuses.map(status => (
  //                     <option key={status} value={status}>{status}</option>
  //                   ))}
  //                 </select>
  //               </div>
                
  //               <div className="lg:col-span-2 flex items-end">
  //                 {hasActiveFilters && (
  //                   <button
  //                     onClick={() => {
  //                       setSearchTerm('');
  //                       setDepartmentFilter('');
  //                       setStatusFilter('');
  //                     }}
  //                     className="w-full px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors font-medium"
  //                     title="Clear all filters"
  //                   >
  //                     <FilterX className="w-4 h-4 mr-2" />
  //                     Clear
  //                   </button>
  //                 )}
  //               </div>
  //             </div>
  //           </div>

  //           {/* Error Display */}
  //           {error && (
  //             <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
  //               <div className="flex items-start space-x-3">
  //                 <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
  //                 <div>
  //                   <h4 className="text-sm font-semibold text-red-800">Error Loading Employees</h4>
  //                   <p className="text-sm text-red-700 mt-1">{error}</p>
  //                 </div>
  //               </div>
  //             </div>
  //           )}

  //           {/* Content */}
  //           <div className="p-6">
  //             {employees.length === 0 ? (
  //               <div className="text-center py-16">
  //                 <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
  //                   <Users className="w-8 h-8 text-slate-400" />
  //                 </div>
  //                 <h3 className="text-lg font-semibold text-slate-900 mb-2">
  //                   {hasActiveFilters ? 'No employees match your criteria' : 'No employees found'}
  //                 </h3>
  //                 <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
  //                   {hasActiveFilters 
  //                     ? 'Try adjusting your search terms or filters to find the employees you\'re looking for.'
  //                     : 'Get started by adding your first employee to build your supply chain team directory.'
  //                   }
  //                 </p>
  //                 {hasActiveFilters ? (
  //                   <button
  //                     onClick={() => {
  //                       setSearchTerm('');
  //                       setDepartmentFilter('');
  //                       setStatusFilter('');
  //                     }}
  //                     className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200 text-sm font-medium transition-colors"
  //                   >
  //                     <FilterX className="w-4 h-4" />
  //                     Clear All Filters
  //                   </button>
  //                 ) : (
  //                   <a
  //                     href="/payroll/employees/new"
  //                     className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors shadow-sm"
  //                   >
  //                     <Plus className="w-4 h-4" />
  //                     Add First Employee
  //                   </a>
  //                 )}
  //               </div>
  //             ) : viewMode === 'grid' ? (
  //               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  //                 {employees.map((employee) => {
  //                   const DeptIcon = getDepartmentIcon(employee.jobDetails?.department);
  //                   return (
  //                     <div key={employee._id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
  //                       <div className="p-6">
  //                         <div className="flex items-start justify-between mb-4">
  //                           <div className="flex items-center gap-3">
  //                             <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
  //                               <span className="text-white font-semibold text-sm">
  //                                 {getInitials(employee.personalDetails?.firstName, employee.personalDetails?.lastName)}
  //                               </span>
  //                             </div>
  //                             <div className="flex-1">
  //                               <h3 className="font-semibold text-slate-900 text-sm">
  //                                 {employee.personalDetails?.firstName} {employee.personalDetails?.lastName}
  //                               </h3>
  //                               <p className="text-xs text-slate-500 mt-0.5">ID: {employee.employeeId}</p>
  //                             </div>
  //                           </div>
  //                         </div>
                          
  //                         <div className="space-y-3 mb-4">
  //                           <div className="flex items-center gap-3">
  //                             <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
  //                               <DeptIcon className="w-4 h-4 text-blue-600" />
  //                             </div>
  //                             <div>
  //                               <p className="text-sm font-medium text-slate-900">{employee.jobDetails?.designation}</p>
  //                               <p className="text-xs text-slate-500">{employee.jobDetails?.department}</p>
  //                             </div>
  //                           </div>
                            
  //                           <div className="flex items-center gap-3">
  //                             <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
  //                               <Calendar className="w-4 h-4 text-green-600" />
  //                             </div>
  //                             <div>
  //                               <p className="text-xs text-slate-600">
  //                                 Joined {employee.personalDetails?.dateOfJoining ? 
  //                                   new Date(employee.personalDetails.dateOfJoining).toLocaleDateString('en-US', { 
  //                                     month: 'short', 
  //                                     year: 'numeric' 
  //                                   }) : 'N/A'}
  //                               </p>
  //                             </div>
  //                           </div>

  //                           {employee.jobDetails?.location && (
  //                             <div className="flex items-center gap-3">
  //                               <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
  //                                 <MapPin className="w-4 h-4 text-purple-600" />
  //                               </div>
  //                               <div>
  //                                 <p className="text-xs text-slate-600">{employee.jobDetails.location}</p>
  //                               </div>
  //                             </div>
  //                           )}
  //                         </div>
                          
  //                         <div className="flex items-center justify-between pt-4 border-t border-slate-200">
  //                           <div className="flex items-center gap-2">
  //                             {getStatusBadge(employee.status)}
  //                           </div>
                            
  //                           <div className="flex items-center gap-1">
  //                             <a
  //                               href={`/payroll/employees/${employee._id}`}
  //                               className="p-2 hover:bg-yellow-50 text-slate-400 hover:text-yellow-600 rounded-lg transition-colors"
  //                               title="View Details"
  //                             >
  //                               <Eye className="w-4 h-4" />
  //                             </a>
  //                             <a
  //                               href={`/payroll/employees/${employee._id}/edit`}
  //                               className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
  //                               title="Edit"
  //                             >
  //                               <Edit className="w-4 h-4" />
  //                             </a>
  //                             <button
  //                               onClick={() => handleDelete(employee._id)}
  //                               className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
  //                               title="Delete"
  //                             >
  //                               <Trash2 className="w-4 h-4" />
  //                             </button>
  //                           </div>
  //                         </div>
  //                       </div>
  //                     </div>
  //                   );
  //                 })}
  //               </div>
  //             ) : (
  //               <div className="overflow-hidden rounded-xl border border-slate-200">
  //                 <table className="w-full">
  //                   <thead className="bg-slate-50 border-b border-slate-200">
  //                     <tr>
  //                       <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Employee</th>
  //                       <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Department</th>
  //                       <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Position</th>
  //                       <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
  //                       <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Join Date</th>
  //                       <th className="text-right py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
  //                     </tr>
  //                   </thead>
  //                   <tbody className="bg-white divide-y divide-slate-200">
  //                     {employees.map((employee) => {
  //                       const DeptIcon = getDepartmentIcon(employee.jobDetails?.department);
  //                       return (
  //                         <tr key={employee._id} className="hover:bg-slate-50 transition-colors">
  //                           <td className="py-4 px-6">
  //                             <div className="flex items-center gap-3">
  //                               <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
  //                                 <span className="text-white font-semibold text-xs">
  //                                   {getInitials(employee.personalDetails?.firstName, employee.personalDetails?.lastName)}
  //                                 </span>
  //                               </div>
  //                               <div>
  //                                 <p className="font-semibold text-slate-900 text-sm">
  //                                   {employee.personalDetails?.firstName} {employee.personalDetails?.lastName}
  //                                 </p>
  //                                 <p className="text-xs text-slate-500">{employee.employeeId}</p>
  //                               </div>
  //                             </div>
  //                           </td>
  //                           <td className="py-4 px-6">
  //                             <div className="flex items-center gap-2">
  //                               <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center border border-blue-100">
  //                                 <DeptIcon className="w-3 h-3 text-blue-600" />
  //                               </div>
  //                               <span className="text-slate-900 text-sm font-medium">{employee.jobDetails?.department || 'N/A'}</span>
  //                             </div>
  //                           </td>
  //                           <td className="py-4 px-6 text-slate-900 text-sm">{employee.jobDetails?.designation || 'N/A'}</td>
  //                           <td className="py-4 px-6">{getStatusBadge(employee.status)}</td>
  //                           <td className="py-4 px-6 text-slate-900 text-sm">
  //                             {employee.personalDetails?.dateOfJoining ? 
  //                               new Date(employee.personalDetails.dateOfJoining).toLocaleDateString() : 'N/A'}
  //                           </td>
  //                           <td className="py-4 px-6 text-right">
  //                             <div className="flex items-center justify-end gap-1">
  //                               <a
  //                                 href={`/payroll/employees/${employee._id}`}
  //                                 className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
  //                                 title="View Details"
  //                               >
  //                                 <Eye className="w-4 h-4" />
  //                               </a>
  //                               <a
  //                                 href={`/payroll/employees/${employee._id}/edit`}
  //                                 className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
  //                                 title="Edit"
  //                               >
  //                                 <Edit className="w-4 h-4" />
  //                               </a>
  //                               <button
  //                                 onClick={() => handleDelete(employee._id)}
  //                                 className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
  //                                 title="Delete"
  //                               >
  //                                 <Trash2 className="w-4 h-4" />
  //                               </button>
  //                             </div>
  //                           </td>
  //                         </tr>
  //                       );
  //                     })}
  //                   </tbody>
  //                 </table>
  //               </div>
  //             )}
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, Users, Calendar,
  Building, TrendingUp, Grid3X3, List, ChevronDown, Briefcase, RefreshCw, X,
  Truck, Warehouse, Package, BarChart3, Settings, Bell, MapPin, Phone, Mail,
  FilterX, AlertCircle, CheckCircle,
  Download, ChevronLeft, ChevronRight, MoreHorizontal, Loader2
} from 'lucide-react';
import { exportToExcel } from '@/utils/exportToExcel';

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage, setEmployeesPerPage] = useState(9); // Default items per page

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, departmentFilter, statusFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(!employees.length);
      setRefreshing(employees.length > 0);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (departmentFilter) params.append('department', departmentFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/payroll/employees?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setEmployees(data.employees || []);
      } else {
        setError(data.error || 'Failed to fetch employees');
        console.error('Failed to fetch employees:', data.error);
      }
    } catch (error) {
      setError('Network error occurred while fetching data');
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pagination calculations
  const paginationData = (() => {
    const totalEmployees = employees.length;
    const totalPages = Math.ceil(totalEmployees / employeesPerPage);
    
    // Calculate current page employees
    const startIndex = (currentPage - 1) * employeesPerPage;
    const endIndex = startIndex + employeesPerPage;
    const currentEmployees = employees.slice(startIndex, endIndex);

    return {
      totalEmployees,
      totalPages,
      currentEmployees,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalEmployees),
      hasPrevious: currentPage > 1,
      hasNext: currentPage < totalPages,
    };
  })();

  console.log('Pagination debug:', {
  totalEmployees: paginationData.totalEmployees,
  employeesPerPage,
  totalPages: paginationData.totalPages,
  currentPage,
  hasPagination: paginationData.totalPages > 1
});


  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, statusFilter, employeesPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEmployeesPerPageChange = (value) => {
    setEmployeesPerPage(Number(value));
    setCurrentPage(1); // Reset to first page
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const { totalPages } = paginationData;
    const current = currentPage;
    const delta = 2; // Number of pages to show on each side of current page
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

  // Export functionality
  const handleExport = async () => {
    try {
      setExportLoading(true);
      
      // Prepare data for export
      const exportData = employees.map(employee => ({
        'Employee ID': employee.employeeId || 'N/A',
        'First Name': employee.personalDetails?.firstName || 'N/A',
        'Last Name': employee.personalDetails?.lastName || 'N/A',
        'Full Name': `${employee.personalDetails?.firstName || ''} ${employee.personalDetails?.lastName || ''}`.trim(),
        'Email': employee.personalDetails?.email || 'N/A',
        'DOB': employee.personalDetails?.dateOfBirth ? new Date(employee.personalDetails.dateOfBirth).toLocaleDateString() : 'N/A',
        'Phone': employee.personalDetails?.phone || 'N/A',
        'Department': employee.jobDetails?.department || 'N/A',
        'Designation': employee.jobDetails?.designation || 'N/A',
        'Work Location': employee.jobDetails?.workLocation || 'N/A',
        'Employment Type': employee.jobDetails?.employmentType || 'N/A',
        'Salary': employee.salaryDetails?.basicSalary ? `$${employee.salaryDetails.basicSalary.toLocaleString()}` : 'N/A',
        'Status': employee.status || 'N/A',
        'Join Date': employee.personalDetails?.dateOfJoining ? 
          new Date(employee.personalDetails.dateOfJoining).toLocaleDateString() : 'N/A',
        'Address': employee.personalDetails?.address ? 
          `${employee.personalDetails.address.street || ''}, ${employee.personalDetails.address.city || ''}, ${employee.personalDetails.address.state || ''}, ${employee.personalDetails.address.zipCode || ''}`.trim() : 'N/A'
      }));

      if (exportData.length > 0) {
        exportToExcel(exportData, 'employee_directory');
      } else {
        alert('No employee data available to export');
      }

    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting employee data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Export filtered data only
  const handleExportFiltered = async () => {
    try {
      setExportLoading(true);
      
      const exportData = employees.map(employee => ({
        'Employee ID': employee.employeeId || 'N/A',
        'Full Name': `${employee.personalDetails?.firstName || ''} ${employee.personalDetails?.lastName || ''}`.trim(),
        'Department': employee.jobDetails?.department || 'N/A',
        'Designation': employee.jobDetails?.designation || 'N/A',
        'Position': employee.jobDetails?.position || 'N/A',
        'Status': employee.status || 'N/A',
        'Join Date': employee.personalDetails?.dateOfJoining ? 
          new Date(employee.personalDetails.dateOfJoining).toLocaleDateString() : 'N/A',
        'Email': employee.personalDetails?.email || 'N/A',
        'Phone': employee.personalDetails?.phone || 'N/A'
      }));

      if (exportData.length > 0) {
        let filename = 'employees';
        if (searchTerm) filename += `_search_${searchTerm}`;
        if (departmentFilter) filename += `_dept_${departmentFilter}`;
        if (statusFilter) filename += `_status_${statusFilter}`;
        
        exportToExcel(exportData, filename);
      } else {
        alert('No filtered employee data available to export');
      }

    } catch (error) {
      console.error('Export filtered error:', error);
      alert('Error exporting filtered data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      const response = await fetch(`/api/payroll/employees/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setEmployees(employees.filter(emp => emp._id !== id));
        // Reset to page 1 if current page becomes empty
        if (paginationData.currentEmployees.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('An error occurred while deleting employee');
    }
  };

  const getStatusConfig = (status) => {
    const statusConfig = {
      Active: { 
        bg: 'bg-green-50', 
        text: 'text-green-700', 
        border: 'border-green-200',
        dot: 'bg-green-500'
      },
      Inactive: { 
        bg: 'bg-slate-50', 
        text: 'text-slate-700', 
        border: 'border-slate-200',
        dot: 'bg-slate-500'
      },
      Suspended: { 
        bg: 'bg-amber-50', 
        text: 'text-amber-700', 
        border: 'border-amber-200',
        dot: 'bg-amber-500'
      },
      Terminated: { 
        bg: 'bg-red-50', 
        text: 'text-red-700', 
        border: 'border-red-200',
        dot: 'bg-red-500'
      },
    };
    return statusConfig[status] || statusConfig.Inactive;
  };

  const getStatusBadge = (status) => {
    const config = getStatusConfig(status);
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
        {status}
      </span>
    );
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getDepartmentIcon = (department) => {
    const icons = {
      Logistics: Truck,
      Warehouse: Warehouse,
      Procurement: Package,
      Inventory: BarChart3,
      Distribution: MapPin,
      Operations: Settings,
      Planning: Calendar
    };
    return icons[department] || Building;
  };

  // Extract unique departments and statuses from fetched data
  const departments = [...new Set(employees.map(emp => emp.jobDetails?.department).filter(Boolean))];
  const statuses = [...new Set(employees.map(emp => emp.status).filter(Boolean))];

  const hasActiveFilters = searchTerm || departmentFilter || statusFilter;

  // Pagination Component - SIMPLIFIED VERSION
  const Pagination = () => {
    const { totalPages, startIndex, endIndex, totalEmployees, hasPrevious, hasNext } = paginationData;
    
    if (totalPages <= 1) return null;

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white rounded-lg border border-slate-200">
        {/* Page info */}
        <div className="text-sm text-slate-600">
          Showing <span className="font-semibold">{startIndex}-{endIndex}</span> of <span className="font-semibold">{totalEmployees}</span> employees
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-2">
          {/* Items per page selector */}
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-slate-600">Show:</span>
            <select
              value={employeesPerPage}
              onChange={(e) => handleEmployeesPerPageChange(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
            >
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
              <option value={18}>18</option>
              <option value={24}>24</option>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-yellow-500 rounded-full animate-spin mx-auto"></div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Loading Employee Directory</h3>
              <p className="text-sm text-slate-600 mt-1">Please wait while we fetch your team data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Employee Directory</h1>
                <p className="text-slate-600 text-sm mt-0.5">Manage your supply chain workforce and team operations</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExport}
                disabled={exportLoading || employees.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exportLoading ? "Exporting..." : "Export"}
              </button>

              <a
                href="/payroll/employees/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Employees</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{employees.length}</p>
                <p className="text-xs text-slate-500 mt-1">Active workforce</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Staff</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {employees.filter(e => e.status === 'Active').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Currently working</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Departments</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {new Set(employees.map(e => e.jobDetails?.department).filter(Boolean)).size}
                </p>
                <p className="text-xs text-slate-500 mt-1">Business units</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-slate-900">
                  Team Directory ({paginationData.totalEmployees})
                </h2>
                {hasActiveFilters && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
                    Filtered Results
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchEmployees}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 disabled:opacity-50 transition-colors font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                {hasActiveFilters && (
                  <button
                    onClick={handleExportFiltered}
                    disabled={exportLoading || employees.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exportLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {exportLoading ? "Exporting..." : "Export Filtered"}
                  </button>
                )}
                
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === 'grid' ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="Grid view"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === 'table' ? 'bg-white shadow-sm text-yellow-600' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="Table view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Search Employees</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                </div>
              </div>
              
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
                >
                  <option value="">All Status</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              <div className="lg:col-span-2 flex items-end">
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setDepartmentFilter('');
                      setStatusFilter('');
                    }}
                    className="w-full px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors font-medium"
                    title="Clear all filters"
                  >
                    <FilterX className="w-4 h-4 mr-2" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800">Error Loading Employees</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {paginationData.currentEmployees.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {hasActiveFilters ? 'No employees match your criteria' : 'No employees found'}
                </h3>
                <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                  {hasActiveFilters 
                    ? 'Try adjusting your search terms or filters to find the employees you\'re looking for.'
                    : 'Get started by adding your first employee to build your supply chain team directory.'
                  }
                </p>
                {hasActiveFilters ? (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setDepartmentFilter('');
                      setStatusFilter('');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200 text-sm font-medium transition-colors"
                  >
                    <FilterX className="w-4 h-4" />
                    Clear All Filters
                  </button>
                ) : (
                  <a
                    href="/payroll/employees/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Employee
                  </a>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginationData.currentEmployees.map((employee) => {
                    const DeptIcon = getDepartmentIcon(employee.jobDetails?.department);
                    return (
                      <div key={employee._id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
                                <span className="text-white font-semibold text-sm">
                                  {getInitials(employee.personalDetails?.firstName, employee.personalDetails?.lastName)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 text-sm">
                                  {employee.personalDetails?.firstName} {employee.personalDetails?.lastName}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">ID: {employee.employeeId}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                                <DeptIcon className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{employee.jobDetails?.designation}</p>
                                <p className="text-xs text-slate-500">{employee.jobDetails?.department}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                                <Calendar className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-600">
                                  Joined {employee.personalDetails?.dateOfJoining ? 
                                    new Date(employee.personalDetails.dateOfJoining).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      year: 'numeric' 
                                    }) : 'N/A'}
                                </p>
                              </div>
                            </div>

                            {employee.jobDetails?.location && (
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                                  <MapPin className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-600">{employee.jobDetails.location}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(employee.status)}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <a
                                href={`/payroll/employees/${employee._id}`}
                                className="p-2 hover:bg-yellow-50 text-slate-400 hover:text-yellow-600 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              <a
                                href={`/payroll/employees/${employee._id}/edit`}
                                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDelete(employee._id)}
                                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Pagination for Grid View */}
                <Pagination />
              </>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Employee</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Department</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Position</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Join Date</th>
                        <th className="text-right py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {paginationData.currentEmployees.map((employee) => {
                        const DeptIcon = getDepartmentIcon(employee.jobDetails?.department);
                        return (
                          <tr key={employee._id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                                  <span className="text-white font-semibold text-xs">
                                    {getInitials(employee.personalDetails?.firstName, employee.personalDetails?.lastName)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">
                                    {employee.personalDetails?.firstName} {employee.personalDetails?.lastName}
                                  </p>
                                  <p className="text-xs text-slate-500">{employee.employeeId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center border border-blue-100">
                                  <DeptIcon className="w-3 h-3 text-blue-600" />
                                </div>
                                <span className="text-slate-900 text-sm font-medium">{employee.jobDetails?.department || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-900 text-sm">{employee.jobDetails?.designation || 'N/A'}</td>
                            <td className="py-4 px-6">{getStatusBadge(employee.status)}</td>
                            <td className="py-4 px-6 text-slate-900 text-sm">
                              {employee.personalDetails?.dateOfJoining ? 
                                new Date(employee.personalDetails.dateOfJoining).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <a
                                  href={`/payroll/employees/${employee._id}`}
                                  className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                                <a
                                  href={`/payroll/employees/${employee._id}/edit`}
                                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => handleDelete(employee._id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination for Table View */}
                <Pagination />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}