// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import {
//   Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, Download, FileText,
//   Calendar, User, CreditCard, CheckCircle, Clock, AlertCircle, ChevronDown, 
//   RefreshCw, Settings, Bell, BarChart3, TrendingUp, DollarSign, FilterX
// } from 'lucide-react';

// export default function PayslipList() {
//   const [payslips, setPayslips] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [monthFilter, setMonthFilter] = useState('');
//   const [yearFilter, setYearFilter] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetchPayslips();
//   }, [searchTerm, monthFilter, yearFilter, statusFilter]);

//   const fetchPayslips = async () => {
//     try {
//       setLoading(!payslips.length);
//       setRefreshing(payslips.length > 0);
//       setError(null);
      
//       const params = new URLSearchParams();
//       if (searchTerm) params.append('search', searchTerm);
//       if (monthFilter) params.append('month', monthFilter);
//       if (yearFilter) params.append('year', yearFilter);
//       if (statusFilter) params.append('status', statusFilter);
      
//       const response = await fetch(`/api/payroll/payslip?${params}`);
//       const data = await response.json();
      
//       if (response.ok) {
//         setPayslips(data.payslips || []);
//       } else {
//         setError(data.error || 'Failed to fetch payslips');
//         console.error('Failed to fetch payslips:', data.error);
//       }
//     } catch (error) {
//       setError('Network error occurred while fetching data');
//       console.error('Error fetching payslips:', error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const getStatusConfig = (status) => {
//     const statusConfig = {
//       Draft: { 
//         bg: 'bg-slate-50', 
//         text: 'text-slate-700', 
//         border: 'border-slate-200', 
//         icon: Clock,
//         dot: 'bg-slate-500'
//       },
//       Generated: { 
//         bg: 'bg-blue-50', 
//         text: 'text-blue-700', 
//         border: 'border-blue-200', 
//         icon: FileText,
//         dot: 'bg-blue-500'
//       },
//       Approved: { 
//         bg: 'bg-green-50', 
//         text: 'text-green-700', 
//         border: 'border-green-200', 
//         icon: CheckCircle,
//         dot: 'bg-green-500'
//       },
//       Paid: { 
//         bg: 'bg-purple-50', 
//         text: 'text-purple-700', 
//         border: 'border-purple-200', 
//         icon: CreditCard,
//         dot: 'bg-purple-500'
//       },
//       Failed: { 
//         bg: 'bg-red-50', 
//         text: 'text-red-700', 
//         border: 'border-red-200', 
//         icon: AlertCircle,
//         dot: 'bg-red-500'
//       },
//     };
//     return statusConfig[status] || statusConfig.Draft;
//   };

//   const getStatusBadge = (status) => {
//     const config = getStatusConfig(status);
//     const Icon = config.icon;
    
//     return (
//       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
//         <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
//         <Icon className="w-3 h-3" />
//         {status}
//       </span>
//     );
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   };

//   const months = [
//     'January', 'February', 'March', 'April', 'May', 'June',
//     'July', 'August', 'September', 'October', 'November', 'December'
//   ];

//   const currentYear = new Date().getFullYear();
//   const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

//   const hasActiveFilters = searchTerm || monthFilter || yearFilter || statusFilter;

//   // Calculate analytics
//   const totalPayslips = payslips.length;
//   const paidPayslips = payslips.filter(p => p.status === 'Paid').length;
//   const pendingPayslips = payslips.filter(p => ['Draft', 'Generated'].includes(p.status)).length;
//   const totalPayrollAmount = payslips.reduce((sum, p) => sum + (p.netSalary || 0), 0);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-50">
//         <div className="flex items-center justify-center h-screen">
//           <div className="text-center space-y-4">
//             <div className="w-12 h-12 border-4 border-slate-200 border-t-yellow-500 rounded-full animate-spin mx-auto"></div>
//             <div>
//               <h3 className="text-lg font-semibold text-slate-900">Loading Payslip Records</h3>
//               <p className="text-sm text-slate-600 mt-1">Please wait while we fetch payroll data...</p>
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
//                 <CreditCard className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-slate-900">Payroll Management</h1>
//                 <p className="text-slate-600 text-sm mt-0.5">Manage employee payslips and salary disbursements</p>
//               </div>
//             </div>
            
//             <div className="flex items-center space-x-2">
//               <button className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
//                 <Bell className="w-5 h-5" />
//               </button>
//               <button className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
//                 <Settings className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
//         {/* Analytics Overview */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-slate-600">Total Payslips</p>
//                 <p className="text-2xl font-bold text-slate-900 mt-2">{totalPayslips}</p>
//                 <p className="text-xs text-slate-500 mt-1">All records</p>
//               </div>
//               <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100">
//                 <FileText className="w-6 h-6 text-yellow-600" />
//               </div>
//             </div>
//           </div>
          
//           {/* <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-slate-600">Paid</p>
//                 <p className="text-2xl font-bold text-slate-900 mt-2">{paidPayslips}</p>
//                 <p className="text-xs text-slate-500 mt-1">Completed payments</p>
//               </div>
//               <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
//                 <CheckCircle className="w-6 h-6 text-green-600" />
//               </div>
//             </div>
//           </div>
          
//           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-slate-600">Pending</p>
//                 <p className="text-2xl font-bold text-slate-900 mt-2">{pendingPayslips}</p>
//                 <p className="text-xs text-slate-500 mt-1">Awaiting processing</p>
//               </div>
//               <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
//                 <Clock className="w-6 h-6 text-amber-600" />
//               </div>
//             </div>
//           </div> */}
          
//           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-slate-600">Total Amount</p>
//                 <p className="text-xl font-bold text-slate-900 mt-2">
//                   {formatCurrency(totalPayrollAmount)}
//                 </p>
//                 <p className="text-xs text-slate-500 mt-1">Payroll value</p>
//               </div>
//               <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
//                 <DollarSign className="w-6 h-6 text-blue-600" />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Controls Panel */}
//         <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
//           <div className="p-6 border-b border-slate-200">
//             <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
//               <div className="flex items-center space-x-3">
//                 <h2 className="text-xl font-semibold text-slate-900">Payslip Records ({totalPayslips})</h2>
//                 {hasActiveFilters && (
//                   <span className="inline-flex items-center px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
//                     Filtered Results
//                   </span>
//                 )}
//               </div>
              
//               <div className="flex items-center space-x-3">
//                 <button
//                   onClick={fetchPayslips}
//                   disabled={refreshing}
//                   className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 disabled:opacity-50 transition-colors font-medium"
//                 >
//                   <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
//                   Refresh
//                 </button>
                
//                 <button className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium">
//                   <Download className="w-4 h-4" />
//                   Export
//                 </button>
                
//                 <Link
//                   href="/payroll/payslip/generate"
//                   className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors shadow-sm"
//                 >
//                   <Plus className="w-4 h-4" />
//                   Generate Payslip
//                 </Link>
//               </div>
//             </div>

//             {/* Search and Filters */}
//             <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
//               <div className="lg:col-span-5">
//                 <label className="block text-sm font-medium text-slate-700 mb-2">Search Payslips</label>
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                   <input
//                     type="text"
//                     placeholder="Search by employee name, ID, or payslip number..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                   />
//                 </div>
//               </div>
              
//               <div className="lg:col-span-2">
//                 <label className="block text-sm font-medium text-slate-700 mb-2">Month</label>
//                 <select
//                   value={monthFilter}
//                   onChange={(e) => setMonthFilter(e.target.value)}
//                   className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
//                 >
//                   <option value="">All Months</option>
//                   {months.map((month, index) => (
//                     <option key={month} value={index + 1}>
//                       {month}
//                     </option>
//                   ))}
//                 </select>
//               </div>
              
//               <div className="lg:col-span-2">
//                 <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
//                 <select
//                   value={yearFilter}
//                   onChange={(e) => setYearFilter(e.target.value)}
//                   className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
//                 >
//                   <option value="">All Years</option>
//                   {years.map(year => (
//                     <option key={year} value={year}>
//                       {year}
//                     </option>
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
//                   <option value="Draft">Draft</option>
//                   <option value="Generated">Generated</option>
//                   <option value="Approved">Approved</option>
//                   <option value="Paid">Paid</option>
//                   <option value="Failed">Failed</option>
//                 </select>
//               </div>
              
//               <div className="lg:col-span-1 flex items-end">
//                 {hasActiveFilters && (
//                   <button
//                     onClick={() => {
//                       setSearchTerm('');
//                       setMonthFilter('');
//                       setYearFilter('');
//                       setStatusFilter('');
//                     }}
//                     className="w-full px-3 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors font-medium"
//                     title="Clear all filters"
//                   >
//                     <FilterX className="w-4 h-4" />
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
//                   <h4 className="text-sm font-semibold text-red-800">Error Loading Payslips</h4>
//                   <p className="text-sm text-red-700 mt-1">{error}</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Data Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-slate-50 border-b border-slate-200">
//                 <tr>
//                   <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Payslip ID</th>
//                   <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Employee</th>
//                   <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Pay Period</th>
//                   <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Net Salary</th>
//                   <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
//                   <th className="text-right py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-slate-200">
//                 {payslips.length === 0 ? (
//                   <tr>
//                     <td colSpan={6} className="px-6 py-16 text-center">
//                       <div className="flex flex-col items-center space-y-4">
//                         <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
//                           <FileText className="w-8 h-8 text-slate-400" />
//                         </div>
//                         <div>
//                           <h3 className="text-lg font-semibold text-slate-900">
//                             {hasActiveFilters ? 'No matching payslips found' : 'No payslips available'}
//                           </h3>
//                           <p className="text-slate-500 text-sm mt-1 max-w-md">
//                             {hasActiveFilters 
//                               ? 'Try adjusting your search criteria or filters to find the payslips you\'re looking for.'
//                               : 'Start by generating payslips for your employees to begin payroll processing.'
//                             }
//                           </p>
//                         </div>
//                         {hasActiveFilters ? (
//                           <button
//                             onClick={() => {
//                               setSearchTerm('');
//                               setMonthFilter('');
//                               setYearFilter('');
//                               setStatusFilter('');
//                             }}
//                             className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200 text-sm font-medium transition-colors"
//                           >
//                             <FilterX className="w-4 h-4" />
//                             Clear All Filters
//                           </button>
//                         ) : (
//                           <Link
//                             href="/payroll/payslip/generate"
//                             className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors shadow-sm"
//                           >
//                             <Plus className="w-4 h-4" />
//                             Generate First Payslip
//                           </Link>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   payslips.map((payslip) => (
//                     <tr key={payslip._id} className="hover:bg-slate-50 transition-colors">
//                       <td className="py-4 px-6">
//                         <div className="font-semibold text-slate-900 text-sm">
//                           {payslip.payslipId}
//                         </div>
//                       </td>
//                       <td className="py-4 px-6">
//                         <div className="flex items-center space-x-3">
//                           <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
//                             <User className="w-5 h-5 text-white" />
//                           </div>
//                           <div>
//                             <div className="font-semibold text-slate-900 text-sm">
//                               {payslip.employee?.personalDetails?.firstName} {payslip.employee?.personalDetails?.lastName}
//                             </div>
//                             <div className="text-xs text-slate-500">
//                               ID: {payslip.employee?.employeeId}
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="py-4 px-6">
//                         <div className="flex items-center space-x-2">
//                           <Calendar className="w-4 h-4 text-slate-400" />
//                           <span className="text-sm font-medium text-slate-900">
//                             {months[payslip.month - 1]} {payslip.year}
//                           </span>
//                         </div>
//                       </td>
//                       <td className="py-4 px-6">
//                         <div className="text-sm font-bold text-slate-900">
//                           {formatCurrency(payslip.netSalary)}
//                         </div>
//                       </td>
//                       <td className="py-4 px-6">
//                         {getStatusBadge(payslip.status)}
//                       </td>
//                       <td className="py-4 px-6 text-right">
//                         <div className="flex items-center justify-center space-x-1">
//                           <Link
//                             href={`/payroll/payslip/${payslip._id}`}
//                             className=" text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
//                             title="View Details"
//                           >
//                             <Eye className="w-4 h-4" />
//                           </Link>
//                           {/* <button
//                             className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                             title="Download PDF"
//                           >
//                             <Download className="w-4 h-4" />
//                           </button> */}
//                           {/* <button
//                             className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
//                             title="More Options"
//                           >
//                             <MoreVertical className="w-4 h-4" />
//                           </button> */}
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, Download, FileText,
  Calendar, User, CreditCard, CheckCircle, Clock, AlertCircle, ChevronDown, 
  RefreshCw, Settings, Bell, BarChart3, TrendingUp, DollarSign, FilterX,
  ChevronLeft, ChevronRight, MoreHorizontal, Loader2
} from 'lucide-react';

export default function PayslipList() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchPayslips();
  }, [searchTerm, monthFilter, yearFilter, statusFilter]);

  const fetchPayslips = async () => {
    try {
      setLoading(!payslips.length);
      setRefreshing(payslips.length > 0);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (monthFilter) params.append('month', monthFilter);
      if (yearFilter) params.append('year', yearFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/payroll/payslip?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setPayslips(data.payslips || []);
      } else {
        setError(data.error || 'Failed to fetch payslips');
        console.error('Failed to fetch payslips:', data.error);
      }
    } catch (error) {
      setError('Network error occurred while fetching data');
      console.error('Error fetching payslips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pagination calculations
  const paginationData = (() => {
    const totalItems = payslips.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Calculate current page items
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = payslips.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalItems),
      hasPrevious: currentPage > 1,
      hasNext: currentPage < totalPages,
    };
  })();

  console.log('Pagination debug:', {
  totalPayslips: payslips.length,
  itemsPerPage,
  totalPages: paginationData.totalPages,
  currentPage,
  hasPagination: paginationData.totalPages > 1
});

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, monthFilter, yearFilter, statusFilter, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
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

  // Pagination Component
  const Pagination = () => {
    const { totalPages, startIndex, endIndex, totalItems, hasPrevious, hasNext } = paginationData;
    
    if (totalPages <= 1) return null;

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white rounded-lg border border-slate-200">
        {/* Page info */}
        <div className="text-sm text-slate-600">
          Showing <span className="font-semibold">{startIndex}-{endIndex}</span> of <span className="font-semibold">{totalItems}</span> payslips
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

  const getStatusConfig = (status) => {
    const statusConfig = {
      Draft: { 
        bg: 'bg-slate-50', 
        text: 'text-slate-700', 
        border: 'border-slate-200', 
        icon: Clock,
        dot: 'bg-slate-500'
      },
      Generated: { 
        bg: 'bg-blue-50', 
        text: 'text-blue-700', 
        border: 'border-blue-200', 
        icon: FileText,
        dot: 'bg-blue-500'
      },
      Approved: { 
        bg: 'bg-green-50', 
        text: 'text-green-700', 
        border: 'border-green-200', 
        icon: CheckCircle,
        dot: 'bg-green-500'
      },
      Paid: { 
        bg: 'bg-purple-50', 
        text: 'text-purple-700', 
        border: 'border-purple-200', 
        icon: CreditCard,
        dot: 'bg-purple-500'
      },
      Failed: { 
        bg: 'bg-red-50', 
        text: 'text-red-700', 
        border: 'border-red-200', 
        icon: AlertCircle,
        dot: 'bg-red-500'
      },
    };
    return statusConfig[status] || statusConfig.Draft;
  };

  const getStatusBadge = (status) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const hasActiveFilters = searchTerm || monthFilter || yearFilter || statusFilter;

  // Calculate analytics
  const totalPayslips = payslips.length;
  const paidPayslips = payslips.filter(p => p.status === 'Paid').length;
  const pendingPayslips = payslips.filter(p => ['Draft', 'Generated'].includes(p.status)).length;
  const totalPayrollAmount = payslips.reduce((sum, p) => sum + (p.netSalary || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-yellow-500 rounded-full animate-spin mx-auto"></div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Loading Payslip Records</h3>
              <p className="text-sm text-slate-600 mt-1">Please wait while we fetch payroll data...</p>
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
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Payroll Management</h1>
                <p className="text-slate-600 text-sm mt-0.5">Manage employee payslips and salary disbursements</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Payslips</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{totalPayslips}</p>
                <p className="text-xs text-slate-500 mt-1">All records</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Amount</p>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  {formatCurrency(totalPayrollAmount)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Payroll value</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <DollarSign className="w-6 h-6 text-blue-600" />
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
                  Payslip Records ({paginationData.totalItems})
                </h2>
                {hasActiveFilters && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
                    Filtered Results
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchPayslips}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 disabled:opacity-50 transition-colors font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                
                <button className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                
                <Link
                  href="/payroll/payslip/generate"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Generate Payslip
                </Link>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">Search Payslips</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by employee name, ID, or payslip number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                </div>
              </div>
              
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Month</label>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
                >
                  <option value="">All Months</option>
                  {months.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
                >
                  <option value="">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
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
                  <option value="Draft">Draft</option>
                  <option value="Generated">Generated</option>
                  <option value="Approved">Approved</option>
                  <option value="Paid">Paid</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              
              <div className="lg:col-span-1 flex items-end">
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setMonthFilter('');
                      setYearFilter('');
                      setStatusFilter('');
                    }}
                    className="w-full px-3 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors font-medium"
                    title="Clear all filters"
                  >
                    <FilterX className="w-4 h-4" />
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
                  <h4 className="text-sm font-semibold text-red-800">Error Loading Payslips</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Payslip ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Employee</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Pay Period</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Net Salary</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {paginationData.currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {hasActiveFilters ? 'No matching payslips found' : 'No payslips available'}
                          </h3>
                          <p className="text-slate-500 text-sm mt-1 max-w-md">
                            {hasActiveFilters 
                              ? 'Try adjusting your search criteria or filters to find the payslips you\'re looking for.'
                              : 'Start by generating payslips for your employees to begin payroll processing.'
                            }
                          </p>
                        </div>
                        {hasActiveFilters ? (
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setMonthFilter('');
                              setYearFilter('');
                              setStatusFilter('');
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200 text-sm font-medium transition-colors"
                          >
                            <FilterX className="w-4 h-4" />
                            Clear All Filters
                          </button>
                        ) : (
                          <Link
                            href="/payroll/payslip/generate"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                            Generate First Payslip
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginationData.currentItems.map((payslip) => (
                    <tr key={payslip._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900 text-sm">
                          {payslip.payslipId}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {payslip.employee?.personalDetails?.firstName} {payslip.employee?.personalDetails?.lastName}
                            </div>
                            <div className="text-xs text-slate-500">
                              ID: {payslip.employee?.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">
                            {months[payslip.month - 1]} {payslip.year}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-bold text-slate-900">
                          {formatCurrency(payslip.netSalary)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(payslip.status)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-center space-x-1">
                          <Link
                            href={`/payroll/payslip/${payslip._id}`}
                            className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination />
        </div>
      </div>
    </div>
  );
}