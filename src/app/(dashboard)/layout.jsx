// 'use client';

// import { useState, useEffect } from 'react';
// import { usePathname, useRouter } from 'next/navigation';
// import Link from 'next/link';
// import {
//   CheckSquare,
//   BarChart3,
//   Menu,
//   X,
//   ChevronDown,
//   Bell,
//   Settings,
//   Search,
//   User,
//   List,
//   Plus,
//   Target,
//   Calendar,
// } from 'lucide-react';
// import '../globals.css';

// export default function DashboardLayout({ children }) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [openMenu, setOpenMenu] = useState(null);
//   const [role, setRole] = useState('employee'); // Force employee role for this dashboard
//   const [loadingRole, setLoadingRole] = useState(true);

//   const pathname = usePathname();
//   const router = useRouter();

//   // If current route is an auth route (no dashboard chrome)
//   const isAuthRoute = pathname?.startsWith('/auth') || pathname === '/login' || pathname === '/auth/login';

//   // Simulate role loading (since forced to employee)
//   useEffect(() => {
//     setTimeout(() => setLoadingRole(false), 100); // Brief loading to prevent flash
//   }, []);

//   const toggleMenu = (menuName) => {
//     setOpenMenu(openMenu === menuName ? null : menuName);
//   };

//   const isActive = (href) => {
//     if (!pathname) return false;
//     // Exact match or startsWith for nested dashboard routes
//     return pathname === href || pathname.startsWith(href + '/');
//   };

//   // Employee-only navigation (no Dashboard link, only Task Management)
//   const employeeNavigation = [
//     {
//       name: 'Task Management',
//       href: '/dashboard/tasks',
//       icon: CheckSquare,
//       children: [
//         // { name: 'All Tasks', href: '/tasks', icon: List },
//         // { name: 'Create Task', href: '/tasks/create', icon: Plus },
//         { name: 'My Tasks', href: '/tasks/my-tasks', icon: Target },
//         { name: 'Task Calendar', href: '/tasks/calendar', icon: Calendar },
//       ],
//     },
//   ];

//   // Use employee navigation only
//   const navigation = employeeNavigation;

//   const userLabel = 'Employee User';
//   const userRole = 'Team Member';
//   const welcomeName = 'Employee';
//   const userInitial = 'E';

//   // If this is an auth route, render children only (no layout) - let root layout handle html/body
//   if (isAuthRoute) {
//     return <>{children}</>;
//   }

//   // While role is loading show simple loading state (prevents flash)
//   if (loadingRole) {
//     return (
//       <div className="flex items-center justify-center h-screen text-slate-700 font-semibold">
//         Loading dashboard...
//       </div>
//     );
//   }

//   // Main layout render - no <html> or <body> here, as this is a nested layout
//   return (
//     <div className="min-h-screen bg-slate-50">

//       {/* Sidebar */}
//       <div
//         className={`${
//           sidebarOpen ? 'translate-x-0' : '-translate-x-full'
//         } fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col h-screen`}
//       >
//         {/* Sidebar Header */}
//         <div className="flex-shrink-0 p-6 border-b border-slate-200 bg-gradient-to-r from-yellow-500 to-amber-500">
//           <div className="flex items-center space-x-3">
//             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
//               <BarChart3 className="w-6 h-6 text-yellow-500" />
//             </div>
//             <div>
//               <h1 className="text-xl font-bold text-white">SupplyChainPro</h1>
//               <p className="text-yellow-100 text-sm">Business Management Suite</p>
//             </div>
//           </div>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
//           {navigation.map((item) => (
//             <div key={item.name} className="space-y-1">
//               {item.children ? (
//                 <div>
//                   <button
//                     onClick={() => toggleMenu(item.name)}
//                     className={`flex items-center w-full p-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
//                       pathname?.startsWith(item.href)
//                         ? 'bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-200'
//                         : 'text-slate-700 hover:bg-slate-100 hover:text-yellow-600'
//                     }`}
//                   >
//                     <div
//                       className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${
//                         pathname?.startsWith(item.href)
//                           ? 'bg-yellow-100 text-yellow-600'
//                           : 'bg-slate-100 text-slate-500 group-hover:bg-yellow-50 group-hover:text-yellow-600'
//                       }`}
//                     >
//                       <item.icon className="h-4 w-4" />
//                     </div>
//                     <span className="flex-1 text-left">{item.name}</span>
//                     <div className={`transition-transform duration-200 ${openMenu === item.name ? 'rotate-180' : ''}`}>
//                       <ChevronDown className="h-4 w-4" />
//                     </div>
//                   </button>

//                   {openMenu === item.name && (
//                     <div className="ml-11 mt-2 space-y-1">
//                       {item.children.map((child) => (
//                         <Link
//                           key={child.name}
//                           href={child.href}
//                           className={`flex items-center p-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
//                             isActive(child.href)
//                               ? 'bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-100'
//                               : 'text-slate-600 hover:bg-slate-50 hover:text-yellow-600'
//                           }`}
//                         >
//                           {child.icon && (
//                             <child.icon className={`h-4 w-4 mr-3 ${isActive(child.href) ? 'text-yellow-600' : 'text-slate-400 group-hover:text-yellow-500'}`} />
//                           )}
//                           {child.name}
//                         </Link>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <Link
//                   href={item.href}
//                   className={`flex items-center p-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
//                     isActive(item.href)
//                       ? 'bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-200'
//                       : 'text-slate-700 hover:bg-slate-100 hover:text-yellow-600'
//                   }`}
//                 >
//                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${isActive(item.href) ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500 group-hover:bg-yellow-50 group-hover:text-yellow-600'}`}>
//                     <item.icon className="h-4 w-4" />
//                   </div>
//                   {item.name}
//                 </Link>
//               )}
//             </div>
//           ))}
//         </nav>

//         {/* Sidebar Footer */}
//         <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-slate-50">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center">
//                 <User className="w-4 h-4 text-white" />
//               </div>
//               <div>
//                 <p className="text-sm font-semibold text-slate-900">{userLabel}</p>
//                 <p className="text-xs text-slate-500">{userRole}</p>
//               </div>
//             </div>
//             <button
//               className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
//               onClick={() => {
//                 localStorage.removeItem('token');
//                 localStorage.removeItem('user');
//                 router.push('/auth/login');
//               }}
//               title="Sign out"
//             >
//               <Settings className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main content area with margin for sidebar */}
//       <div className="lg:ml-80">
//         {/* Header */}
//         <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
//           <div className="px-6 py-4">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center space-x-4">
//                 <button
//                   onClick={() => setSidebarOpen(!sidebarOpen)}
//                   className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors duration-200"
//                 >
//                   {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//                 </button>

//                 <div className="hidden md:block">
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                     <input
//                       type="text"
//                       placeholder="Search tasks, calendars..."
//                       className="w-80 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="flex items-center space-x-4">
//                 <button className="relative p-2.5 text-slate-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
//                   <Bell className="h-5 w-5" />
//                   <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
//                 </button>

//                 <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
//                   <div className="text-right hidden sm:block">
//                     <p className="text-sm font-semibold text-slate-900">Welcome, {welcomeName}</p>
//                     <p className="text-xs text-slate-500">{userRole}</p>
//                   </div>
//                   <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center shadow-sm">
//                     <span className="text-white font-semibold text-sm">{userInitial}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </header>

//         <main className="bg-slate-50">{children}</main>
//       </div>

//       {/* Mobile overlay */}
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}
//     </div>
//   );
// }

// 'use client';

// import { useState, useEffect } from 'react';
// import { usePathname, useRouter } from 'next/navigation';
// import Link from 'next/link';
// import {
//   Users,
//   CreditCard,
//   CheckSquare,
//   BarChart3,
//   Menu,
//   X,
//   ChevronDown,
//   Home,
//   Bell,
//   Settings,
//   Search,
//   User,
//   Shield,
//   Calculator,
//   FileText,
//   List,
//   Plus,
//   Target,
//   Calendar,
// } from 'lucide-react';
// import '../globals.css';

// export default function DashboardLayout({ children }) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [openMenu, setOpenMenu] = useState(null);
//   const [role, setRole] = useState(null); // 'admin' | 'employee' | null
//   const [loadingRole, setLoadingRole] = useState(true);

//   const pathname = usePathname();
//   const router = useRouter();

//   // Log for debugging (remove later)
//   useEffect(() => {
//     console.log('Current pathname:', pathname);
//     console.log('Current role:', role);
//   }, [pathname, role]);

//   // If current route is an auth route (no dashboard chrome)
//   const isAuthRoute = pathname?.startsWith('/auth') || pathname === '/login' || pathname === '/auth/login';

//   // Read user role from localStorage (or other client storage)
//   useEffect(() => {
//     try {
//       const raw = localStorage.getItem('user'); // expected: JSON string { id, email, role, ... }
//       console.log('localStorage user raw:', raw); // Debug log
//       if (raw) {
//         const parsed = JSON.parse(raw);
//         if (parsed?.role) {
//           setRole(parsed.role.toString().toLowerCase());
//         } else {
//           setRole(null);
//         }
//       } else {
//         setRole(null);
//       }
//     } catch (err) {
//       console.error('Failed to read user from localStorage', err);
//       setRole(null);
//     } finally {
//       setLoadingRole(false);
//     }
//   }, []);

//   const toggleMenu = (menuName) => {
//     setOpenMenu(openMenu === menuName ? null : menuName);
//   };

//   const isActive = (href) => {
//     if (!pathname) return false;
//     // Simple exact or startsWith (no special '/' case to avoid tasks bleed)
//     return pathname === href || pathname.startsWith(href + '/');
//   };

//   // Role-based navigation definitions
//   const adminNavigation = [
//     { name: 'Dashboard', href: '/', icon: Home },
//     {
//       name: 'Payroll Management',
//       href: '/dashboard/payroll',
//       icon: CreditCard,
//       children: [
//         { name: 'Employee Directory', href: '/payroll/employees', icon: Users },
//         { name: 'Payslip Generation', href: '/payroll/payslip', icon: FileText },
//         { name: 'Tax Calculations', href: '/payroll/tax-calculations', icon: Calculator },
//         { name: 'Compliance Reports', href: '/payroll/compliance', icon: Shield },
//       ],
//     },
//      {
//       name: 'Task Management',
//       href: '/dashboard/tasks',
//       icon: CheckSquare,
//       children: [
//         { name: 'All Tasks', href: '/tasks', icon: List },
//         { name: 'Create Task', href: '/tasks/create', icon: Plus },
//         { name: 'My Tasks', href: '/tasks/my-tasks', icon: Target },
//         { name: 'Task Calendar', href: '/tasks/calendar', icon: Calendar },
//       ],
//     },
//   ];

//   const employeeNavigation = [
//     { name: 'Dashboard', href: '/', icon: Home },
//     {
//       name: 'Task Management',
//       href: '/dashboard/tasks',
//       icon: CheckSquare,
//       children: [
//         { name: 'All Tasks', href: '/tasks', icon: List },
//         { name: 'Create Task', href: '/tasks/create', icon: Plus },
//         { name: 'My Tasks', href: '/tasks/my-tasks', icon: Target },
//         { name: 'Task Calendar', href: '/tasks/calendar', icon: Calendar },
//       ],
//     },
//   ];

//   // Decide which navigation to show based on role
//   const navigation = role === 'admin' ? adminNavigation : role === 'employee' ? employeeNavigation : adminNavigation;  // Default to admin if unknown

//   // If this is an auth route, render children only (no layout) - let root layout handle html/body
//   if (isAuthRoute) {
//     return <>{children}</>;
//   }

//   // While role is loading show simple loading state (prevents flash)
//   if (loadingRole) {
//     return (
//       <div className="flex items-center justify-center h-screen text-slate-700 font-semibold">
//         Loading dashboard...
//       </div>
//     );
//   }

//   // If no role found (not logged in) redirect to login
//   if (!role) {
//     useEffect(() => {
//       router.push('/auth/login');
//     }, []);
//     return null; // Don't render anything during redirect
//   }

//   // Main layout render - no <html> or <body> here, as this is a nested layout
//   return (
//     <div className="min-h-screen bg-slate-50">

//       {/* Sidebar */}
//       <div
//         className={`${
//           sidebarOpen ? 'translate-x-0' : '-translate-x-full'
//         } fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col h-screen`}
//       >
//         {/* Sidebar Header */}
//         <div className="flex-shrink-0 p-6 border-b border-slate-200 bg-gradient-to-r from-yellow-500 to-amber-500">
//           <div className="flex items-center space-x-3">
//             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
//               <BarChart3 className="w-6 h-6 text-yellow-500" />
//             </div>
//             <div>
//               <h1 className="text-xl font-bold text-white">SupplyChainPro</h1>
//               <p className="text-yellow-100 text-sm">Business Management Suite</p>
//             </div>
//           </div>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
//           {navigation.map((item) => (
//             <div key={item.name} className="space-y-1">
//               {item.children ? (
//                 <div>
//                   <button
//                     onClick={() => toggleMenu(item.name)}
//                     className={`flex items-center w-full p-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
//                       pathname?.startsWith(item.href)
//                         ? 'bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-200'
//                         : 'text-slate-700 hover:bg-slate-100 hover:text-yellow-600'
//                     }`}
//                   >
//                     <div
//                       className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${
//                         pathname?.startsWith(item.href)
//                           ? 'bg-yellow-100 text-yellow-600'
//                           : 'bg-slate-100 text-slate-500 group-hover:bg-yellow-50 group-hover:text-yellow-600'
//                       }`}
//                     >
//                       <item.icon className="h-4 w-4" />
//                     </div>
//                     <span className="flex-1 text-left">{item.name}</span>
//                     <div className={`transition-transform duration-200 ${openMenu === item.name ? 'rotate-180' : ''}`}>
//                       <ChevronDown className="h-4 w-4" />
//                     </div>
//                   </button>

//                   {openMenu === item.name && (
//                     <div className="ml-11 mt-2 space-y-1">
//                       {item.children.map((child) => (
//                         <Link
//                           key={child.name}
//                           href={child.href}
//                           className={`flex items-center p-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
//                             isActive(child.href)
//                               ? 'bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-100'
//                               : 'text-slate-600 hover:bg-slate-50 hover:text-yellow-600'
//                           }`}
//                         >
//                           {child.icon && (
//                             <child.icon className={`h-4 w-4 mr-3 ${isActive(child.href) ? 'text-yellow-600' : 'text-slate-400 group-hover:text-yellow-500'}`} />
//                           )}
//                           {child.name}
//                         </Link>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <Link
//                   href={item.href}
//                   className={`flex items-center p-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
//                     isActive(item.href)
//                       ? 'bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-200'
//                       : 'text-slate-700 hover:bg-slate-100 hover:text-yellow-600'
//                   }`}
//                 >
//                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${isActive(item.href) ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500 group-hover:bg-yellow-50 group-hover:text-yellow-600'}`}>
//                     <item.icon className="h-4 w-4" />
//                   </div>
//                   {item.name}
//                 </Link>
//               )}
//             </div>
//           ))}
//         </nav>

//         {/* Sidebar Footer */}
//         <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-slate-50">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center">
//                 <User className="w-4 h-4 text-white" />
//               </div>
//               <div>
//                 <p className="text-sm font-semibold text-slate-900">{role === 'admin' ? 'Admin User' : 'Employee User'}</p>
//                 <p className="text-xs text-slate-500 capitalize">{role}</p>
//               </div>
//             </div>
//             <button
//               className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
//               onClick={() => {
//                 localStorage.removeItem('token');
//                 localStorage.removeItem('user');
//                 router.push('/auth/login');
//               }}
//               title="Sign out"
//             >
//               <Settings className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main content area with margin for sidebar */}
//       <div className="lg:ml-80">
//         {/* Header */}
//         <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
//           <div className="px-6 py-4">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center space-x-4">
//                 <button
//                   onClick={() => setSidebarOpen(!sidebarOpen)}
//                   className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors duration-200"
//                 >
//                   {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//                 </button>

//                 <div className="hidden md:block">
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                     <input
//                       type="text"
//                       placeholder="Search employees, reports, tasks..."
//                       className="w-80 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="flex items-center space-x-4">
//                 <button className="relative p-2.5 text-slate-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
//                   <Bell className="h-5 w-5" />
//                   <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
//                 </button>

//                 <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
//                   <div className="text-right hidden sm:block">
//                     <p className="text-sm font-semibold text-slate-900">Welcome, {role === 'admin' ? 'Admin' : 'Employee'}</p>
//                     <p className="text-xs text-slate-500 capitalize">{role}</p>
//                   </div>
//                   <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center shadow-sm">
//                     <span className="text-white font-semibold text-sm">{role?.charAt(0)?.toUpperCase()}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </header>

//         <main className="bg-slate-50">{children}</main>
//       </div>

//       {/* Mobile overlay */}
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}
//     </div>
//   );
// }

// 'use client';

// import { useState, useEffect } from 'react';
// import { usePathname, useRouter } from 'next/navigation';
// import Link from 'next/link';
// import {
//   Users,
//   CreditCard,
//   CheckSquare,
//   BarChart3,
//   Menu,
//   X,
//   ChevronDown,
//   Home,
//   Bell,
//   Search,
//   User,
//   Shield,
//   Calculator,
//   FileText,
//   List,
//   Plus,
//   Target,
//   Calendar,
//   LogOut,
//   UserCheck,
// } from 'lucide-react';
// import '../globals.css';
// import { useSession } from '@/context/SessionContext';

// export default function DashboardLayout({ children }) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [openMenu, setOpenMenu] = useState(null);
//   const [role, setRole] = useState(null); // 'admin' | 'employee' | null
//   const [loadingRole, setLoadingRole] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');

//   const { user, logout } = useSession();
//   const pathname = usePathname();
//   const router = useRouter();

//   console.log('User From Layout: - ', user);

//   useEffect(() => {
//     if (user) {
//       setRole(user.role); // Assuming user object has a 'role' property
//       setLoadingRole(false);
//       if (pathname?.startsWith('/payroll') && user.role !== 'admin') {
//       router.push('/'); // Redirect non-admins to the dashboard home
//     }
//     } else {
//       router.push('/auth/login');
//     }
//   }, [user, router,pathname]);

//   const toggleMenu = (menuName) => {
//     setOpenMenu(openMenu === menuName ? null : menuName);
//   };

//   const isActive = (href) => {
//     if (!pathname) return false;
//     return pathname === href || pathname.startsWith(href + '/');
//   };

//   const adminNavigation = [
//     { name: 'Dashboard', href: '/', icon: Home },
//     {
//       name: 'Payroll Management',
//       href: '/dashboard/payroll',
//       icon: CreditCard,
//       children: [
//         { name: 'Employee Directory', href: '/payroll/employees', icon: Users },
//         { name: 'Attendance Directory', href: '/payroll/attendance', icon: UserCheck },
//         { name: 'Payslip Generation', href: '/payroll/payslip', icon: FileText },
//         { name: 'Tax Calculations', href: '/payroll/tax-calculations', icon: Calculator },
//         { name: 'Compliance Reports', href: '/payroll/compliance', icon: Shield },
//       ],
//     },
//     {
//       name: 'Task Management',
//       href: '/dashboard/tasks',
//       icon: CheckSquare,
//       children: [
//         { name: 'All Tasks', href: '/tasks', icon: List },
//         { name: 'Create Task', href: '/tasks/create', icon: Plus },
//         { name: 'My Tasks', href: '/tasks/my-tasks', icon: Target },
//         { name: 'Task Calendar', href: '/tasks/calendar', icon: Calendar },
//       ],
//     },
//   ];

//   const employeeNavigation = [
//     { name: 'Dashboard', href: '/', icon: Home },
//     {
//       name: 'Task Management',
//       href: '/dashboard/tasks',
//       icon: CheckSquare,
//       children: [
//         { name: 'My Tasks', href: '/tasks/my-tasks', icon: Target },
//         { name: 'Task Calendar', href: '/tasks/calendar', icon: Calendar },
//       ],
//     },
//   ];

//   const navigation = role === 'admin' ? adminNavigation : role === 'employee' ? employeeNavigation : [];

//   const isAuthRoute = pathname?.startsWith('/auth') || pathname === '/login' || pathname === '/auth/login';
//   if (isAuthRoute) {
//     return <>{children}</>;
//   }

//   if (loadingRole) {
//     return (
//       <div className="flex items-center justify-center h-screen text-slate-700 font-semibold">
//         Loading dashboard...
//       </div>
//     );
//   }

//   if (!role) {
//     return null;
//   }

//   return (
//     <div className="min-h-screen bg-slate-50">
//       <div
//         className={`${
//           sidebarOpen ? 'translate-x-0' : '-translate-x-full'
//         } fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col h-screen`}
//       >
//         <div className="flex-shrink-0 p-6 border-b border-slate-200 bg-gradient-to-r from-yellow-500 to-amber-500">
//           <div className="flex items-center space-x-3">
//             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
//               <BarChart3 className="w-6 h-6 text-yellow-500" />
//             </div>
//             <div>
//               <h1 className="text-xl font-bold text-white">SupplyChainPro</h1>
//               <p className="text-yellow-100 text-sm">Business Management Suite</p>
//             </div>
//           </div>
//         </div>

//         <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
//           {navigation.map((item) => (
//             <div key={item.name} className="space-y-1">
//               {item.children ? (
//                 <div>
//                   <button
//                     onClick={() => toggleMenu(item.name)}
//                     className={`flex items-center w-full p-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
//                       pathname?.startsWith(item.href)
//                         ? 'bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-200'
//                         : 'text-slate-700 hover:bg-slate-100 hover:text-yellow-600'
//                     }`}
//                     aria-expanded={openMenu === item.name}
//                   >
//                     <div
//                       className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${
//                         pathname?.startsWith(item.href)
//                           ? 'bg-yellow-100 text-yellow-600'
//                           : 'bg-slate-100 text-slate-500 group-hover:bg-yellow-50 group-hover:text-yellow-600'
//                       }`}
//                     >
//                       <item.icon className="h-4 w-4" />
//                     </div>
//                     <span className="flex-1 text-left">{item.name}</span>
//                     <div className={`transition-transform duration-200 ${openMenu === item.name ? 'rotate-180' : ''}`}>
//                       <ChevronDown className="h-4 w-4" />
//                     </div>
//                   </button>

//                   {openMenu === item.name && (
//                     <div className="ml-11 mt-2 space-y-1">
//                       {item.children.map((child) => (
//                         <Link
//                           key={child.name}
//                           href={child.href}
//                           className={`flex items-center p-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
//                             isActive(child.href)
//                               ? 'bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-100'
//                               : 'text-slate-600 hover:bg-slate-50 hover:text-yellow-600'
//                           }`}
//                         >
//                           {child.icon && (
//                             <child.icon
//                               className={`h-4 w-4 mr-3 ${
//                                 isActive(child.href) ? 'text-yellow-600' : 'text-slate-400 group-hover:text-yellow-500'
//                               }`}
//                             />
//                           )}
//                           {child.name}
//                         </Link>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <Link
//                   href={item.href}
//                   className={`flex items-center p-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
//                     isActive(item.href)
//                       ? 'bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-200'
//                       : 'text-slate-700 hover:bg-slate-100 hover:text-yellow-600'
//                   }`}
//                 >
//                   <div
//                     className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${
//                       isActive(item.href)
//                         ? 'bg-yellow-100 text-yellow-600'
//                         : 'bg-slate-100 text-slate-500 group-hover:bg-yellow-50 group-hover:text-yellow-600'
//                     }`}
//                   >
//                     <item.icon className="h-4 w-4" />
//                   </div>
//                   {item.name}
//                 </Link>
//               )}
//             </div>
//           ))}
//         </nav>

//         <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-slate-50">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center">
//                 <User className="w-4 h-4 text-white" />
//               </div>
//               <div>
//                 <p className="text-sm font-semibold text-slate-900">
//                   {user?.name || (role === 'admin' ? 'Admin User' : 'Employee User')}
//                 </p>
//                 <p className="text-xs text-slate-500 capitalize">{role}</p>
//               </div>
//             </div>
//             <button
//               className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
//               onClick={() => {
//                 logout();
//                 router.push('/auth/login');
//               }}
//               title="Sign out"
//               aria-label="Sign out"
//             >
//               <LogOut className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="lg:ml-80">
//         <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
//           <div className="px-6 py-4">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center space-x-4">
//                 <button
//                   onClick={() => setSidebarOpen(!sidebarOpen)}
//                   className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors duration-200"
//                   aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
//                 >
//                   {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//                 </button>

//                 <div className="hidden md:block">
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                     <input
//                       type="text"
//                       placeholder="Search employees, reports, tasks..."
//                       value={searchQuery}
//                       onChange={(e) => setSearchQuery(e.target.value)}
//                       className="w-80 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
//                       aria-label="Search employees, reports, or tasks"
//                     />
//                   </div>
//                 </div>
//                 <button
//                   className="md:hidden p-2.5 text-slate-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
//                   aria-label="Open search"
//                   onClick={() => {/* Implement mobile search modal */}}
//                 >
//                   <Search className="h-5 w-5" />
//                 </button>
//               </div>

//               <div className="flex items-center space-x-4">
//                 <button
//                   className="relative p-2.5 text-slate-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
//                   aria-label="Notifications"
//                 >
//                   <Bell className="h-5 w-5" />
//                   <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
//                 </button>

//                 <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
//                   <div className="text-right hidden sm:block">
//                     <p className="text-sm font-semibold text-slate-900">
//                       Welcome, {user?.name || (role === 'admin' ? 'Admin' : 'Employee')}
//                     </p>
//                     <p className="text-xs text-slate-500 capitalize">{role}</p>
//                   </div>
//                   <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center shadow-sm">
//                     <span className="text-white font-semibold text-sm">
//                       {user?.name?.charAt(0)?.toUpperCase() || role?.charAt(0)?.toUpperCase()}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </header>

//         <main className="bg-slate-50">{children}</main>
//       </div>

//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}
//     </div>
//   );
// }


'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  CreditCard,
  CheckSquare,
  BarChart3,
  Menu,
  X,
  ChevronDown,
  Home,
  Bell,
  Search,
  User,
  Shield,
  Calculator,
  FileText,
  List,
  Plus,
  Target,
  Calendar,
  LogOut,
  UserCheck,
  Eye,
  ShoppingCart,
  History,
  Banknote,
  Aperture,
  BanknoteArrowUp,
  CalculatorIcon,
  File,
} from 'lucide-react';
import '../globals.css';
import { useSession } from '@/context/SessionContext';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'employee' | null
  const [loadingRole, setLoadingRole] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { user, isLoading, logout } = useSession(); // Assume isLoading is provided by SessionContext
  const pathname = usePathname();
  const router = useRouter();

  console.log('User From Layout: - ', user, 'IsLoading: - ', isLoading);

useEffect(() => {
  if (isLoading) {
    // Wait for session to load
    return;
  }
 
  if (user) {
    setRole(user.role);
    setLoadingRole(false);
    // Define protected routes that only admins can access
    const protectedRoutes = [
      '/payroll/*',
      '/payslip',
      '/taxes',
      '/compliances'
    ];
    // Check if the pathname starts with any protected route
    // const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));
    // Redirect non-admins from protected routes
    // if (isProtectedRoute && user.role !== 'admin') {
    //   router.push('/'); // Redirect to home if not admin
    // }
  } else {
    // router.push('/auth/login'); // Redirect to login if no user
  }
}, [user, isLoading, router, pathname]);

  const toggleMenu = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const isActive = (href) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const adminNavigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    {
      name: 'Payroll Management',
      href: '/dashboard/payroll',
      icon: CreditCard,
      children: [
        { name: 'Employee Directory', href: '/payroll/employees', icon: Users },
        { name: 'Attendance Directory', href: '/payroll/attendance', icon: UserCheck },
        { name: 'Payslip Generation', href: '/payroll/payslip', icon: FileText },
        { name: 'Tax Calculations', href: '/payroll/tax-calculations', icon: Calculator },
        { name: 'Compliance Reports', href: '/payroll/compliance', icon: Shield },
      ],
    },
    {
      name: 'Task Management',
      href: '/dashboard/tasks',
      icon: CheckSquare,
      children: [
        // { name: 'All Tasks', href: '/tasks', icon: List },
        { name: 'Create Task', href: '/tasks/create', icon: Plus },
        { name: 'My Tasks', href: '/tasks/my-tasks', icon: Target },
        { name: 'Task Calendar', href: '/tasks/calendar', icon: Calendar },
      ],
    },
      // {
      //   name: 'Order Management',
      //   href: '/dashboard/order',
      //   icon: ShoppingCart,
      //   children: [
      //     { name: 'All Order', href: '/order/all-order', icon: Eye },
      //     { name: 'Order Verification', href: '/order/order-verification', icon: Plus },
      //     { name: 'Verified Order', href: '/order/verified-orders', icon: CheckSquare },
      //     { name: 'Order History', href: '/order/order-history', icon: History },
      //   ],
      // },
      // {
      //   name: 'Accountant Management',
      //   href: '/dashboard/accountant',
      //   icon: Banknote,
      //   children: [
      //     { name: 'payment Management', href: '/accountant/payment-management', icon: Banknote },
      //     { name: 'Auto Discount Calculation', href: '/accountant/auto-discount', icon: CalculatorIcon },
      //     { name: 'Payment Follow-Up', href: '/accountant/payment-followup', icon: BanknoteArrowUp },
      //     { name: 'Performance Index', href: '/accountant/performance', icon: Aperture },
      //     { name: 'Acknowledged Copies', href: '/accountant/acknowledged-copies', icon: File },
      //   ],
      // },
  ];

   const supervisorNavigation = [
    // { name: 'Dashboard', href: '/', icon: Home },
    {
      name: 'Payroll Management',
      href: '/dashboard/payroll',
      icon: CreditCard,
      children: [
        { name: 'Attendance Directory', href: '/payroll/attendance', icon: UserCheck },
      ],
    },
    {
      name: 'Task Management',
      href: '/dashboard/tasks',
      icon: CheckSquare,
      children: [
        // { name: 'All Tasks', href: '/tasks', icon: List },
        { name: 'Create Task', href: '/tasks/create', icon: Plus },
        { name: 'My Tasks', href: '/tasks/my-tasks', icon: Target },
        { name: 'Task Calendar', href: '/tasks/calendar', icon: Calendar },
      ],
    },
  ];

  const employeeNavigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    {
      name: 'Task Management',
      href: '/dashboard/tasks',
      icon: CheckSquare,
      children: [
        { name: 'My Tasks', href: '/tasks/my-tasks', icon: Target },
        { name: 'Task Calendar', href: '/tasks/calendar', icon: Calendar },
      ],
    },
  ];



  // const navigation = role === 'admin' ? adminNavigation ? role === 'employee' : employeeNavigation : supervisorNavigation;
  let navigation = []
  if(role === 'admin'){
    navigation = adminNavigation
  }else if(role === 'Employee'){
    navigation = employeeNavigation
  }else if(role === 'Supervisor'){
    navigation = supervisorNavigation
  }else{
    navigation = [] 
  }

  console.log("Navigation :- ",navigation);
  

  const isAuthRoute = pathname?.startsWith('/auth') || pathname === '/auth/login';
  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (isLoading || loadingRole) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-700 font-semibold">
        Loading dashboard...
      </div>
    );
  }

  if (!role) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col h-screen`}
      >
        <div className="flex-shrink-0 p-6 border-b border-slate-200 bg-gradient-to-r from-yellow-500 to-amber-500">
          <div className="flex items-center space-x-3">
           <div className="flex items-center space-x-3">
                <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
                <div>
                  <h1 className="text-xl font-bold text-white">UniFoods</h1>
                  <p className="text-yellow-100 text-xs">Always towards the path of innovation</p>
                </div>
              </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation?.map((item) => (
            <div key={item.name} className="space-y-1">
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`flex items-center w-full p-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                      pathname?.startsWith(item.href)
                        ? 'bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-200'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-yellow-600'
                    }`}
                    aria-expanded={openMenu === item.name}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${
                        pathname?.startsWith(item.href)
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-yellow-50 group-hover:text-yellow-600'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1 text-left">{item.name}</span>
                    <div className={`transition-transform duration-200 ${openMenu === item.name ? 'rotate-180' : ''}`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>

                  {openMenu === item.name && (
                    <div className="ml-11 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={`flex items-center p-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                            isActive(child.href)
                              ? 'bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-100'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-yellow-600'
                          }`}
                        >
                          {child.icon && (
                            <child.icon
                              className={`h-4 w-4 mr-3 ${
                                isActive(child.href) ? 'text-yellow-600' : 'text-slate-400 group-hover:text-yellow-500'
                              }`}
                            />
                          )}
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center p-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    isActive(item.href)
                      ? 'bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-200'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-yellow-600'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${
                      isActive(item.href)
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-yellow-50 group-hover:text-yellow-600'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {user?.personalDetails?.firstName || (role === 'admin' ? 'Admin User' : 'Employee User')}
                </p>
                <p className="text-xs text-slate-500 capitalize">{role}</p>
              </div>
            </div>
            <button
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
              onClick={() => {
                logout();
                router.push('/auth/login');
              }}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="lg:ml-80">
        <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors duration-200"
                  aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                >
                  {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                <div className="hidden md:block">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search employees, reports, tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-80 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                      aria-label="Search employees, reports, or tasks"
                    />
                  </div>
                </div>
                <button
                  className="md:hidden p-2.5 text-slate-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                  aria-label="Open search"
                  onClick={() => {/* Implement mobile search modal */}}
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center space-x-4">

                <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-900">
                      Welcome, {user?.personalDetails?.firstName || (role === 'admin' ? 'Admin' : 'Employee')}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{role}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || role?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="bg-slate-50">{children}</main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
