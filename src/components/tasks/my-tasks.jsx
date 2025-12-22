// "use client";

// import { useState, useEffect, useMemo } from "react";
// import Link from "next/link";
// import {
//   CheckCircle,
//   Clock,
//   AlertCircle,
//   User,
//   Calendar,
//   Target,
//   TrendingUp,
//   Award,
//   Zap,
//   Filter,
//   Search,
//   Plus,
//   FileText,
//   Bell,
//   Star,
//   ArrowUp,
//   ArrowDown,
//   CheckCircle2,
//   Activity,
//   Timer,
//   BarChart3,
//   RefreshCw,
//   X,
//   SlidersHorizontal,
//   Grid3X3,
//   List,
//   Focus,
//   Flame,
//   Coffee,
//   Brain,
//   Edit,
//   History,
//   BarChart,
//   TargetIcon,
//   CalendarDays,
//   Clock4,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { useSession } from "@/context/SessionContext";

// export default function MyTasks() {
//   const { user } = useSession();
//   const [tasks, setTasks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [viewMode, setViewMode] = useState("list");
//   const [stats, setStats] = useState({
//     total: 0,
//     completed: 0,
//     pending: 0,
//     overdue: 0,
//     inProgress: 0,
//     todayDue: 0,
//     thisWeekDue: 0,
//   });
//   const [filter, setFilter] = useState("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [priorityFilter, setPriorityFilter] = useState("");
//   const [error, setError] = useState("");
//   const [progressModalOpen, setProgressModalOpen] = useState(false);
//   const [selectedTask, setSelectedTask] = useState(null);
//   const [progressPercentage, setProgressPercentage] = useState(0);
//   const [progressComments, setProgressComments] = useState("");
//   const [detailsModalOpen, setDetailsModalOpen] = useState(false);
//   const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);


//   /**
//    * MEMOIZED FILTERING & SORTING LOGIC
//    * This hook handles all filtering and sorting (newest first) based on state changes.
//    */
//   const filteredTasks = useMemo(() => {
//     let result = tasks;

//     // 1. Search Term Filtering
//     if (searchTerm.trim()) {
//       const term = searchTerm.toLowerCase();
//       result = result.filter(task =>
//         task.title.toLowerCase().includes(term) ||
//         (task.description && task.description.toLowerCase().includes(term)) ||
//         (task.tags && task.tags.some(t => t.toLowerCase().includes(term)))
//       );
//     }

//     // Prepare date for special filters
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     // 2. Special Filters (Overdue and Today) - applied before general status filter
//     if (filter === "overdue") {
//       result = result.filter(task => {
//         if (task.status === "Completed" || !task.dueDate) return false;
//         return new Date(task.dueDate) < today;
//       });
//     } else if (filter === "today") {
//       result = result.filter(task => {
//         if (task.status === "Completed" || !task.dueDate) return false;
//         const due = new Date(task.dueDate);
//         due.setHours(0, 0, 0, 0);
//         return due.getTime() === today.getTime(); // Check if due date is exactly today
//       });
//     } else if (filter !== "all") {
//       // 3. General Status Filtering
//       result = result.filter(task => task.status === filter);
//     }

//     // 4. Priority Filtering
//     if (priorityFilter) {
//       result = result.filter(task => task.priority === priorityFilter);
//     }

//     // 5. Sorting: Latest task at the top (by createdAt descending)
//     result.sort((a, b) => {
//         // Handle null/undefined dates by pushing them to the bottom
//         if (!a.createdAt) return 1;
//         if (!b.createdAt) return -1;
        
//         // Sort descending (b - a for newest first)
//         return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
//     });

//     return result;
//   }, [tasks, searchTerm, filter, priorityFilter]);


//   useEffect(() => {
//     console.log("🔄 MyTasks component mounted, user:", user);
//     if (user) {
//       fetchMyTasks();
//     } else {
//         if (!user) {
//           setError("User session not available. Please log in again.");
//         }
//     }
//   }, [user]);


//   const fetchMyTasks = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       if (!user || !user.id) {
//         throw new Error("User not authenticated");
//       }

//       const response = await fetch("/api/tasks");
      
//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Failed to fetch tasks: ${response.status}`);
//       }

//       const data = await response.json();
//       const allTasks = data.data || [];

//       let assignedTasks = [];
//       if (user.role === "admin") {
//         // Admins see all tasks
//         assignedTasks = allTasks; 
//       } else if (user.role === "Employee") {
//         // Employees see tasks assigned to them
//         assignedTasks = allTasks?.filter((task) => {
//           if (!task?.assignedTo) return false;
//           // Handles both populated and unpopulated assignedTo fields
//           const assignedToId = task.assignedTo._id?.toString() || task.assignedTo.toString();
//           const userId = user.id?.toString();
//           return assignedToId === userId;
//         });
//       } else if (user.role === "Supervisor") {
//         // Supervisors see tasks they assigned
//         assignedTasks = allTasks.filter((task) => {
//           const assignedById = task.assignedBy?.toString();
//           const userId = user.id.toString();
//           return assignedById === userId;
//         });
//       }

//       setTasks(assignedTasks);
//       calculateStats(assignedTasks);
//     } catch (err) {
//       console.error("❌ Error in fetchMyTasks:", err);
//       setError(err.message || "Failed to load tasks");
//       setTasks([]);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const calculateStats = (taskList) => {
//     if (!taskList || !Array.isArray(taskList)) {
//       setStats({
//         total: 0,
//         completed: 0,
//         pending: 0,
//         overdue: 0,
//         inProgress: 0,
//         todayDue: 0,
//         thisWeekDue: 0,
//       });
//       return;
//     }

//     const now = new Date();
//     const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
//     // Get the start of the current week (Sunday)
//     const firstDayOfWeek = new Date(today);
//     firstDayOfWeek.setDate(today.getDate() - today.getDay()); 

//     // Get the end of the current week (Saturday midnight)
//     const lastDayOfWeek = new Date(firstDayOfWeek);
//     lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 7);


//     const newStats = {
//       total: taskList.length,
//       completed: taskList.filter((task) => task.status === "Completed").length,
//       pending: taskList.filter((task) => task.status === "Pending").length,
      
//       // Calculate overdue based on tasks not completed and due date passed
//       overdue: taskList.filter(
//         (task) =>
//           task.status !== "Completed" &&
//           task.dueDate &&
//           new Date(task.dueDate) < today
//       ).length,

//       inProgress: taskList.filter((task) => task.status === "In Progress").length,
      
//       // Calculate tasks due today (due date matches today)
//       todayDue: taskList.filter(
//         (task) =>
//           task.status !== "Completed" &&
//           task.dueDate &&
//           new Date(task.dueDate).toDateString() === today.toDateString()
//       ).length,

//       // Calculate tasks due this week (due date >= today AND < last day of week)
//       thisWeekDue: taskList.filter(
//         (task) =>
//           task.status !== "Completed" &&
//           task.dueDate &&
//           new Date(task.dueDate) >= today && 
//           new Date(task.dueDate) < lastDayOfWeek
//       ).length,
//     };

//     setStats(newStats);
//   };

//   const handleRefresh = async () => {
//     setRefreshing(true);
//     await fetchMyTasks();
//   };

//   const handleStatusUpdate = (task) => {
//     if (!task || !task._id) {
//       setError("Cannot update task: Invalid task data");
//       return;
//     }

//     // If task is pending, start it with 0% progress
//     if (task.status === "Pending") {
//       handleProgressUpdate(task._id, 0, "Started working on the task");
//     } 
//     // If task is already in progress, show progress modal to update it
//     else if (task.status === "In Progress" && (task.progress || 0) < 100) {
//       setSelectedTask(task);
//       setProgressPercentage(task.progress || 0);
//       setProgressComments("");
//       setProgressModalOpen(true);
//     } 
//     // If progress is already 100%, allow completion
//     else if (task.status === "In Progress" && (task.progress || 0) >= 100) {
//       handleStatusChange(task._id, "Completed");
//     }
//   };

//   const handleProgressUpdate = async (taskId, progress, comments = "") => {
//     try {
//       setError("");
      
//       const updateData = {
//         progress: progress,
//         lastUpdated: new Date().toISOString(),
//       };

//       // Add progress comment if provided
//       if (comments) {
//         // Find the current task details to preserve existing comments
//         const currentTask = tasks.find(t => t._id === taskId);

//         updateData.progressComments = [
//           ...(currentTask?.progressComments || []), 
//           {
//             comment: comments,
//             progress: progress,
//             date: new Date().toISOString()
//           }
//         ];
//       }

//       // Update status based on progress
//       if (progress === 0 && selectedTask?.status === "Pending") {
//         updateData.status = "In Progress";
//       } else if (progress === 100) {
//         updateData.status = "Completed";
//         updateData.completedAt = new Date().toISOString();
//       } else if (progress > 0 && progress < 100) {
//         updateData.status = "In Progress";
//       }


//       const response = await fetch(`/api/tasks/${taskId}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(updateData),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         if (!data.success || !data.task) {
//           throw new Error(data.error || "Invalid response: Missing task data");
//         }

//         const updatedTask = data.task;
        
//         // Update local state with the new task
//         setTasks((prevTasks) =>
//           prevTasks.map((task) =>
//             task._id === taskId ? updatedTask : task
//           )
//         );
        
//         // Recalculate stats with the fully updated list
//         const updatedTasksList = tasks.map(task => 
//           task._id === taskId ? updatedTask : task
//         );
//         calculateStats(updatedTasksList);

//         setProgressModalOpen(false);
//         setSelectedTask(null);
//         setProgressPercentage(0);
//         setProgressComments("");
//       } else {
//         const data = await response.json().catch(() => ({}));
//         throw new Error(data.error || data.message || "Failed to update task progress");
//       }
//     } catch (error) {
//       console.error("❌ Error updating task progress:", error);
//       setError(`Error updating task progress: ${error.message}`);
//     }
//   };

//   const handleProgressSubmit = async () => {
//     if (!selectedTask || !selectedTask._id) {
//       setError("No task selected for update");
//       return;
//     }

//     await handleProgressUpdate(selectedTask._id, progressPercentage, progressComments);
//   };

//   const handleStatusChange = async (taskId, newStatus) => {
//     if (!taskId || taskId === "undefined" || taskId === "") {
//       setError("Cannot update task: Invalid task ID");
//       return;
//     }

//     try {
//       setError("");

//       const response = await fetch(`/api/tasks/${taskId}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           status: newStatus,
//           ...(newStatus === "Completed" && {
//             completedAt: new Date().toISOString(),
//             progress: 100,
//           }),
//         }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         if (!data.success || !data.task) {
//           throw new Error(data.error || "Invalid response: Missing task data");
//         }

//         const updatedTask = data.task;
//         setTasks((prevTasks) =>
//           prevTasks.map((task) => (task._id === taskId ? updatedTask : task))
//         );
        
//         const updatedTasks = tasks.map(task => 
//           task._id === taskId ? updatedTask : task
//         );
//         calculateStats(updatedTasks);
//       } else {
//         const data = await response.json().catch(() => ({}));
//         throw new Error(data.error || data.message || "Failed to update task status");
//       }
//     } catch (error) {
//       console.error("❌ Error updating task status:", error);
//       setError(`Error updating task status: ${error.message}`);
//       // Re-fetch in case of failure to ensure data consistency
//       await fetchMyTasks(); 
//     }
//   };

//   const handleViewDetails = (task) => {
//     setSelectedTaskDetails(task);
//     setDetailsModalOpen(true);
//   };

//   const getStatusBadge = (status, completedAt = null) => {
//     const statusConfig = {
//       Pending: {
//         color: "bg-amber-50 text-amber-700 border-amber-200",
//         icon: Clock,
//       },
//       "In Progress": {
//         color: "bg-yellow-50 text-yellow-700 border-yellow-200",
//         icon: Activity,
//       },
//       Completed: {
//         color: "bg-green-50 text-green-700 border-green-200",
//         icon: CheckCircle2,
//       },
//       Blocked: {
//         color: "bg-red-50 text-red-700 border-red-200",
//         icon: AlertCircle,
//       },
//       Deferred: {
//         color: "bg-slate-50 text-slate-700 border-slate-200",
//         icon: Clock,
//       },
//     };

//     const { color, icon: Icon } = statusConfig[status] || statusConfig.Pending;

//     const formatTime = (dateString) => {
//       if (!dateString) return null;
//       return new Date(dateString).toLocaleTimeString("en-US", {
//         hour: "numeric",
//         minute: "2-digit",
//         hour12: true,
//       });
//     };

//     const timeText = status === "Completed" && completedAt ? formatTime(completedAt) : null;
//     const displayText = status === "Completed" && timeText ? `Completed at ${timeText}` : status;

//     const badgeClass = `${color} border flex items-center gap-1.5 font-medium text-xs px-2 py-1 rounded-full`;

//     return (
//       <Badge className={badgeClass}>
//         <Icon className="h-3 w-3 flex-shrink-0" />
//         <span className="truncate">{displayText}</span>
//       </Badge>
//     );
//   };

//   const getPriorityBadge = (priority) => {
//     const priorityColors = {
//       Low: "bg-slate-50 text-slate-600 border-slate-200",
//       Medium: "bg-yellow-50 text-yellow-600 border-yellow-200",
//       High: "bg-orange-50 text-orange-600 border-orange-200",
//       Urgent: "bg-red-50 text-red-600 border-red-200",
//     };

//     const priorityIcons = {
//       Low: <ArrowDown className="h-3 w-3" />,
//       Medium: <div className="w-3 h-3 rounded-full bg-current opacity-60"></div>,
//       High: <ArrowUp className="h-3 w-3" />,
//       Urgent: <Zap className="h-3 w-3" />,
//     };

//     return (
//       <Badge className={`${priorityColors[priority]} border flex items-center gap-1.5 font-medium text-xs px-2 py-1 rounded-full`}>
//         {priorityIcons[priority]}
//         {priority}
//       </Badge>
//     );
//   };

//   const isOverdue = (dueDate) => {
//     if (!dueDate) return false;
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const due = new Date(dueDate);
//     due.setHours(0, 0, 0, 0);

//     return due < today;
//   };

//   const formatDate = (date) => {
//     if (!date) return "No due date";
//     return new Date(date).toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     });
//   };

//   const formatDateTime = (date) => {
//     if (!date) return "N/A";
//     return new Date(date).toLocaleString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const getDaysUntilDue = (dueDate) => {
//     if (!dueDate) return null;
//     const today = new Date();
//     const due = new Date(dueDate);
//     const diffTime = due.getTime() - today.getTime();
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     return diffDays;
//   };

//   const clearFilters = () => {
//     setSearchTerm("");
//     setFilter("all");
//     setPriorityFilter("");
//   };

//   const activeFiltersCount = [
//     searchTerm,
//     filter !== "all" ? filter : "",
//     priorityFilter,
//   ].filter(Boolean).length;

//   // Enhanced Task Card Component
//   const TaskCard = ({ task }) => {
//     const isTaskOverdue = isOverdue(task.dueDate);
//     const progress = task.progress || 0;

//     return (
//       <Card className={`group hover:shadow-lg transition-all duration-200 ${task.status === "Completed" ? "opacity-80" : ""} ${isTaskOverdue && task.status !== "Completed" ? "ring-2 ring-red-200 bg-red-50/30" : ""}`}>
//         <CardHeader className="pb-3">
//           <div className="flex items-start justify-between">
//             <div className="flex-1 min-w-0">
//               <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors line-clamp-1 mb-1">
//                 {task.title}
//               </CardTitle>
//               <CardDescription className="text-sm text-gray-500 line-clamp-2">
//                 {task.description}
//               </CardDescription>
//             </div>
//             <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
//               {getStatusBadge(task.status, task.completedAt)}
//               {getPriorityBadge(task.priority)}
//               {isTaskOverdue && task.status !== "Completed" && (
//                 <Badge className="bg-red-50 text-red-600 border-red-200 border font-medium animate-pulse text-xs px-2 py-0.5">
//                   <AlertCircle className="h-2.5 w-2.5 mr-1" />
//                   Overdue
//                 </Badge>
//               )}
//             </div>
//           </div>
//         </CardHeader>
        
//         <CardContent className="space-y-3">
//           {/* Progress Section */}
//           <div className="space-y-2">
//             <div className="flex justify-between items-center">
//               <span className="text-xs font-medium text-gray-700">Progress</span>
//               <span className="text-xs font-bold text-yellow-600">
//                 {progress}%
//               </span>
//             </div>
//             <div className="w-full bg-gray-200 rounded-full h-2">
//               <div
//                 className={`h-2 rounded-full transition-all duration-500 ${
//                   progress === 0 ? "bg-gray-400" :
//                   progress < 50 ? "bg-yellow-500" :
//                   progress < 100 ? "bg-blue-500" : "bg-green-500"
//                 }`}
//                 style={{ width: `${progress}%` }}
//               />
//             </div>
//             {task.status === "In Progress" && progress < 100 && (
//               <div className="flex gap-1">
//                 {[25, 50, 75, 100].map((value) => (
//                   <button
//                     key={value}
//                     onClick={() => {
//                       setSelectedTask(task);
//                       setProgressPercentage(value);
//                       setProgressComments("");
//                       setProgressModalOpen(true);
//                     }}
//                     className={`flex-1 text-xs py-1 px-2 rounded border transition-colors ${
//                       value <= progress
//                         ? "bg-green-100 text-green-700 border-green-300"
//                         : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
//                     }`}
//                     disabled={value <= progress}
//                   >
//                     {value}%
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Task Metadata */}
//           <div className="flex items-center justify-between text-xs text-gray-600">
//             <div className="flex items-center gap-2">
//               <Calendar className="h-3 w-3" />
//               <span className={`font-medium ${
//                 isTaskOverdue && task.status !== "Completed"
//                   ? "text-red-600"
//                   : "text-gray-700"
//               }`}>
//                 {formatDate(task.dueDate)}
//                 {isTaskOverdue && task.status !== "Completed" && (
//                   <span className="ml-1 text-red-500 font-semibold">(Overdue)</span>
//                 )}
//               </span>
//             </div>
//             {task.estimatedHours && (
//               <div className="flex items-center gap-1">
//                 <Clock className="h-3 w-3" />
//                 <span>{task.estimatedHours}h</span>
//               </div>
//             )}
//           </div>

//           {/* Tags */}
//           <div className="flex items-center gap-2 flex-wrap">
//             {task.category && (
//               <Badge className="bg-gray-50 text-gray-700 border-gray-200 border font-medium text-xs px-2 py-0.5">
//                 {task.category}
//               </Badge>
//             )}
//             {task.tags && task.tags.slice(0, 2).map((tag, index) => (
//               <Badge key={index} className="bg-yellow-50 text-yellow-700 border-yellow-200 border font-medium text-xs px-2 py-0.5">
//                 #{tag}
//               </Badge>
//             ))}
//           </div>

//           {/* Action Buttons */}
//           <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
//             {task.status !== "Completed" ? (
//              <Button
//       size="sm"
//       className={`${
//         task.status === "In Progress"
//           ? "bg-green-500 hover:bg-green-600"
//           : "bg-yellow-500 hover:bg-yellow-600"
//       } text-white shadow-sm px-3 py-1.5 font-medium flex-1 h-8
      
//       /* <<< --- ADDED / MODIFIED LINES HERE --- >>> */
//       flex justify-center items-center whitespace-nowrap 
//       /* <<< ----------------------------------- >>> */
//       `}
//       onClick={() => handleStatusUpdate(task)}
//     >
//       {task.status === "In Progress" && progress < 100 ? (
//         <>
//           <Edit className="h-3 w-3 mr-1 flex-shrink-0" />
//           <span className="truncate">Update Progress</span> {/* Encapsulate text for truncation safety */}
//         </>
//       ) : task.status === "In Progress" && progress >= 100 ? (
//         <>
//           <CheckCircle2 className="h-3 w-3 mr-1 flex-shrink-0" />
//           <span className="truncate">Mark Completed</span>
//         </>
//       ) : (
//         <>
//           <Activity className="h-3 w-3 mr-1 flex-shrink-0" />
//           <span className="truncate">Start Progress</span>
//         </>
//       )}
//     </Button>
//             ) : (
//                <Button
//   size="sm"
//   className="bg-green-500 hover:bg-green-600 text-white shadow-sm px-3 py-2 font-medium flex items-center justify-center min-h-[32px] opacity-90 cursor-default"
//   disabled
// >
//   <CheckCircle2 className="h-4 w-4 mr-1.5" />
//   Task Completed
// </Button>
//             )}
//             <Button
//               variant="outline"
//               size="sm"
//               className="flex-1 h-8 px-3 py-1.5 font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
//               onClick={() => handleViewDetails(task)}
//             >
//               <FileText className="h-3 w-3 mr-1" />
//               Details
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     );
//   };

//   // Progress History Component
//   const ProgressHistory = ({ progressComments }) => {
//     if (!progressComments || !Array.isArray(progressComments) || progressComments.length === 0) {
//       return (
//         <div className="text-center py-4 text-gray-500">
//           <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
//           <p className="text-sm">No progress updates yet</p>
//         </div>
//       );
//     }

//     return (
//       <div className="space-y-3 max-h-60 overflow-y-auto">
//         {progressComments.map((update, index) => (
//           <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
//             <div className="flex-shrink-0">
//               <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
//                 <span className="text-blue-600 font-bold text-sm">{update.progress}%</span>
//               </div>
//             </div>
//             <div className="flex-1 min-w-0">
//               <div className="flex justify-between items-start mb-1">
//                 <span className="font-medium text-gray-900">Progress updated to {update.progress}%</span>
//                 <span className="text-xs text-gray-500">
//                   {formatDateTime(update.date)}
//                 </span>
//               </div>
//               {update.comment && (
//                 <p className="text-sm text-gray-700">{update.comment}</p>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   if (error && !loading) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <div className="max-w-7xl mx-auto px-6 py-8">
//           <div className="bg-red-50 border border-red-200 rounded-lg p-6">
//             <div className="flex items-center space-x-3">
//               <AlertCircle className="h-6 w-6 text-red-500" />
//               <div>
//                 <h3 className="text-lg font-semibold text-red-800">
//                   Error Loading Tasks
//                 </h3>
//                 <p className="text-red-700">{error}</p>
//                 <p className="text-red-600 text-sm mt-2">
//                   Please check your browser console for more details.
//                 </p>
//               </div>
//             </div>
//             <div className="flex gap-3 mt-4">
//               <Button
//                 onClick={fetchMyTasks}
//                 className="bg-red-600 hover:bg-red-700 text-white"
//               >
//                 Try Again
//               </Button>
//               <Button onClick={() => setError("")} variant="outline">
//                 Dismiss
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <div className="bg-white border-b border-gray-200">
//           <div className="max-w-7xl mx-auto px-6 py-6">
//             <div className="flex items-center space-x-4">
//               <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
//                 <User className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
//                 <p className="text-gray-600 text-sm mt-0.5">
//                   Loading your personal task dashboard...
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="max-w-7xl mx-auto px-6 py-8">
//           <div className="flex justify-center items-center h-64">
//             <div className="flex flex-col items-center space-y-4">
//               <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-200 border-t-yellow-500"></div>
//               <p className="text-gray-600 font-medium">
//                 Loading your tasks...
//               </p>
//               <p className="text-gray-500 text-sm">
//                 Checking database connection...
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-6 py-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
//                 <User className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
//                 <p className="text-gray-600 text-sm mt-0.5">
//                   {tasks.length > 0
//                     ? `You have ${tasks.length} total task${tasks.length !== 1 ? "s" : ""} assigned`
//                     : "Your personal task dashboard"}
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center space-x-3">
//               <button
//                 onClick={handleRefresh}
//                 disabled={refreshing}
//                 className="p-2.5 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
//                 title="Refresh tasks"
//               >
//                 <RefreshCw
//                   className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
//                 />
//               </button>

//               {(user?.role === "admin" || user?.role === "Supervisor") && (
//                 <Link href="/tasks/create">
//                   <Button className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm px-6 py-2.5 font-semibold">
//                     <Plus className="h-4 w-4 mr-2" />
//                     New Task
//                   </Button>
//                 </Link>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
//         {/* Error Alert */}
//         {error && (
//           <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <AlertCircle className="h-5 w-5 text-red-500" />
//               <span className="text-red-700 text-sm font-medium">{error}</span>
//             </div>
//             <button
//               onClick={() => setError("")}
//               className="text-red-500 hover:text-red-700"
//             >
//               <X className="h-4 w-4" />
//             </button>
//           </div>
//         )}

//         {/* Statistics Dashboard */}
//         <Card>
//           <CardHeader className="border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <CardTitle className="flex items-center gap-3 text-xl">
//                   <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
//                     <BarChart3 className="w-4 h-4 text-yellow-600" />
//                   </div>
//                   Personal Dashboard
//                 </CardTitle>
//                 <CardDescription>
//                   Track your productivity and task completion progress
//                 </CardDescription>
//               </div>
//               <div className="text-sm text-gray-500">
//                 Last updated: {new Date().toLocaleTimeString()}
//               </div>
//             </div>
//           </CardHeader>

//           <CardContent className="pt-6 px-6 pb-6">
//             {/* Main Stats Grid */}
//             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
//               <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
//                     <Target className="w-5 h-5 text-gray-600" />
//                   </div>
//                   <TrendingUp className="w-4 h-4 text-gray-400" />
//                 </div>
//                 <p className="text-gray-600 text-sm font-medium">
//                   Total Tasks
//                 </p>
//                 <p className="text-2xl font-semibold text-gray-900">
//                   {stats.total}
//                 </p>
//               </div>

//               <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
//                     <Activity className="w-5 h-5 text-yellow-600" />
//                   </div>
//                   <Focus className="w-4 h-4 text-yellow-400" />
//                 </div>
//                 <p className="text-yellow-600 text-sm font-medium">
//                   In Progress
//                 </p>
//                 <p className="text-2xl font-semibold text-yellow-700">
//                   {stats.inProgress}
//                 </p>
//               </div>

//               <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
//                     <Clock className="w-5 h-5 text-amber-600" />
//                   </div>
//                   <Timer className="w-4 h-4 text-amber-400" />
//                 </div>
//                 <p className="text-amber-600 text-sm font-medium">Pending</p>
//                 <p className="text-2xl font-semibold text-amber-700">
//                   {stats.pending}
//                 </p>
//               </div>

//               <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
//                     <CheckCircle className="w-5 h-5 text-green-600" />
//                   </div>
//                   <div className="text-xs text-green-600 font-medium">
//                     {stats.total > 0
//                       ? Math.round((stats.completed / stats.total) * 100)
//                       : 0}
//                     %
//                   </div>
//                 </div>
//                 <p className="text-green-600 text-sm font-medium">Completed</p>
//                 <p className="text-2xl font-semibold text-green-700">
//                   {stats.completed}
//                 </p>
//               </div>

//               <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
//                     <AlertCircle className="w-5 h-5 text-red-600" />
//                   </div>
//                   {stats.overdue > 0 && (
//                     <Bell className="w-4 h-4 text-red-500 animate-pulse" />
//                   )}
//                 </div>
//                 <p className="text-red-600 text-sm font-medium">Overdue</p>
//                 <p className="text-2xl font-semibold text-red-700">
//                   {stats.overdue}
//                 </p>
//               </div>

//               <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
//                     <Calendar className="w-5 h-5 text-purple-600" />
//                   </div>
//                   {stats.todayDue > 0 && (
//                     <Star className="w-4 h-4 text-purple-500" />
//                   )}
//                 </div>
//                 <p className="text-purple-600 text-sm font-medium">Due Today</p>
//                 <p className="text-2xl font-semibold text-purple-700">
//                   {stats.todayDue}
//                 </p>
//               </div>

//               <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                     <Flame className="w-5 h-5 text-blue-600" />
//                   </div>
//                   <Coffee className="w-4 h-4 text-blue-400" />
//                 </div>
//                 <p className="text-blue-600 text-sm font-medium">This Week</p>
//                 <p className="text-2xl font-semibold text-blue-700">
//                   {stats.thisWeekDue}
//                 </p>
//               </div>
//             </div>

//             {/* Quick Actions & Insights */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* Quick Actions */}
//               <div className="space-y-3">
//                 <h3 className="font-semibold text-gray-900 text-sm">
//                   Quick Actions
//                 </h3>
//                 <div className="flex flex-wrap gap-2">
//                   {stats.overdue > 0 && (
//                     <button
//                       onClick={() => setFilter("overdue")}
//                       className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
//                     >
//                       Focus on Overdue ({stats.overdue})
//                     </button>
//                   )}
//                   {stats.todayDue > 0 && (
//                     <button
//                       onClick={() => setFilter("today")}
//                       className="px-3 py-1.5 bg-purple-50 text-purple-600 text-sm rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
//                     >
//                       Today's Tasks ({stats.todayDue})
//                     </button>
//                   )}
//                   <button
//                     onClick={() => setFilter("In Progress")}
//                     className="px-3 py-1.5 bg-yellow-50 text-yellow-600 text-sm rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors"
//                   >
//                     Continue Working ({stats.inProgress})
//                   </button>
//                 </div>
//               </div>

//               {/* Productivity Insight */}
//               <div className="space-y-3">
//                 <h3 className="font-semibold text-gray-900 text-sm">
//                   Productivity Insight
//                 </h3>
//                 <div className="bg-gradient-to-r from-yellow-50 to-blue-50 p-3 rounded-lg border border-yellow-200">
//                   <div className="flex items-center gap-2 mb-1">
//                     <Brain className="w-4 h-4 text-yellow-600" />
//                     <span className="text-sm font-medium text-yellow-800">
//                       {stats.total > 0 && stats.completed / stats.total > 0.7
//                         ? "Excellent Progress!"
//                         : stats.total > 0 && stats.completed / stats.total > 0.5
//                         ? "Good Momentum!"
//                         : "Keep Going!"}
//                     </span>
//                   </div>
//                   <p className="text-xs text-yellow-700">
//                     {stats.total > 0
//                       ? Math.round((stats.completed / stats.total) * 100)
//                       : 0}
//                     % completion rate
//                     {stats.overdue > 0 &&
//                       ` • ${stats.overdue} tasks need attention`}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Filters */}
//         <Card>
//           <CardContent className="pt-6 px-6 pb-6">
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-center gap-3">
//                 <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
//                   <SlidersHorizontal className="w-4 h-4 text-yellow-600" />
//                 </div>
//                 <div>
//                   <CardTitle className="text-lg">Filter & Search</CardTitle>
//                   <CardDescription>
//                     Find and organize your personal tasks
//                   </CardDescription>
//                 </div>
//               </div>
//               <div className="flex items-center space-x-3">
//                 {activeFiltersCount > 0 && (
//                   <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
//                     {activeFiltersCount} filter
//                     {activeFiltersCount !== 1 ? "s" : ""} active
//                   </span>
//                 )}
//                 <div className="flex rounded-lg border border-gray-200 p-1">
//                   <button
//                     onClick={() => setViewMode("list")}
//                     // 1. FIXED: Added text-gray-600 to ensure icon visibility
//                     className={`p-2 rounded transition-colors text-gray-600 ${
//                       viewMode === "list"
//                         ? "bg-yellow-100 text-yellow-600"
//                         : "hover:text-yellow-600 hover:bg-yellow-50"
//                     }`}
//                   >
//                     <List className="w-4 h-4" />
//                   </button>
//                   <button
//                     onClick={() => setViewMode("grid")}
//                     // 1. FIXED: Added text-gray-600 to ensure icon visibility
//                     className={`p-2 rounded transition-colors text-gray-600 ${
//                       viewMode === "grid"
//                         ? "bg-yellow-100 text-yellow-600"
//                         : "hover:text-yellow-600 hover:bg-yellow-50"
//                     }`}
//                   >
//                     <Grid3X3 className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>
//             </div>

//             <div className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="md:col-span-1">
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Search Tasks
//                   </label>
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                     <Input
//                       placeholder="Search your tasks..."
//                       className="pl-10 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                     {searchTerm && (
//                       <button
//                         onClick={() => setSearchTerm("")}
//                         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                     )}
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Status
//                   </label>
//                   <select
//                     className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
//                     value={filter}
//                     onChange={(e) => setFilter(e.target.value)}
//                   >
//                     <option value="all">All Tasks</option>
//                     <option value="Pending">Pending</option>
//                     <option value="In Progress">In Progress</option>
//                     <option value="Completed">Completed</option>
//                     <option value="overdue">Overdue</option>
//                     <option value="today">Due Today</option>
//                     <option value="Blocked">Blocked</option>
//                     <option value="Deferred">Deferred</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Priority
//                   </label>
//                   <select
//                     className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
//                     value={priorityFilter}
//                     onChange={(e) => setPriorityFilter(e.target.value)}
//                   >
//                     <option value="">All Priorities</option>
//                     <option value="Low">Low</option>
//                     <option value="Medium">Medium</option>
//                     <option value="High">High</option>
//                     <option value="Urgent">Urgent</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="flex items-center justify-between pt-2 border-t border-gray-100">
//                 <div className="flex items-center space-x-4">
//                   <span className="text-sm text-gray-600 font-medium">
//                     Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
//                   </span>
//                   {activeFiltersCount > 0 && (
//                     <button
//                       onClick={clearFilters}
//                       className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
//                     >
//                       <X className="w-3 h-3" />
//                       Clear all filters
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Tasks Display */}
//         {filteredTasks.length === 0 ? (
//           <Card>
//             <CardContent className="text-center py-16">
//               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
//                 <Target className="h-8 w-8 text-gray-400" />
//               </div>
//               <CardTitle className="text-xl mb-2">No tasks found</CardTitle>
//               <CardDescription className="mb-6 max-w-md mx-auto">
//                 {activeFiltersCount > 0
//                   ? "No tasks match your current filters. Try adjusting your search criteria."
//                   : filter === "all"
//                   ? "You don't have any tasks assigned yet. Create your first task to get started!"
//                   : `No ${filter.toLowerCase()} tasks found.`}
//               </CardDescription>
//               <div className="flex items-center justify-center space-x-3">
//                 {activeFiltersCount > 0 && (
//                   <Button
//                     variant="outline"
//                     onClick={clearFilters}
//                     className="px-6 py-2.5 font-medium"
//                   >
//                     <Filter className="w-4 h-4 mr-2" />
//                     Clear Filters
//                   </Button>
//                 )}
//                 {(user?.role === "admin" || user?.role === "Supervisor") && (
//                   <Link href="/tasks/create">
//                     <Button className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm px-6 py-2.5 font-semibold">
//                       <Plus className="w-4 h-4 mr-2" />
//                       Create Your First Task
//                     </Button>
//                   </Link>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         ) : (
//           <div
//             className={
//               viewMode === "grid"
//                 ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
//                 : "space-y-6"
//             }
//           >
//             {/* 2. FIXED: Uses sorted/filtered list from useMemo */}
//             {filteredTasks.map((task) => (
//               <TaskCard key={task._id} task={task} />
//             ))}
//           </div>
//         )}

//         {/* Completion Progress */}
//         {stats.total > 0 && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Completion Rate Card */}
//             <Card className="bg-gradient-to-br from-yellow-50 to-blue-50 border-yellow-200">
//               <CardHeader className="pb-4">
//                 <CardTitle className="flex items-center gap-2 text-yellow-800">
//                   <Award className="h-5 w-5" />
//                   Completion Progress
//                 </CardTitle>
//                 <CardDescription className="text-yellow-700">
//                   Track your productivity and achievement rate
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="space-y-2">
//                   <div className="flex justify-between text-sm">
//                     <span className="font-medium text-yellow-800">
//                       Completion Rate
//                     </span>
//                     <span className="font-semibold text-yellow-900">
//                       {stats.total > 0
//                         ? Math.round((stats.completed / stats.total) * 100)
//                         : 0}
//                       %
//                     </span>
//                   </div>
//                   <div className="w-full bg-yellow-200 rounded-full h-3">
//                     <div
//                       className="bg-gradient-to-r from-yellow-500 to-blue-500 h-3 rounded-full transition-all duration-500 shadow-sm"
//                       style={{
//                         width: `${
//                           stats.total > 0
//                             ? (stats.completed / stats.total) * 100
//                             : 0
//                         }%`,
//                       }}
//                     ></div>
//                   </div>
//                   <div className="flex justify-between text-xs text-yellow-700">
//                     <span>{stats.completed} completed</span>
//                     <span>{stats.total - stats.completed} remaining</span>
//                   </div>
//                 </div>

//                 {/* Achievement Badge */}
//                 <div className="pt-3 border-t border-yellow-200">
//                   <div className="flex items-center gap-2">
//                     <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
//                       {stats.total > 0 && stats.completed / stats.total > 0.8 ? (
//                         <Star className="w-4 h-4 text-white" />
//                       ) : stats.total > 0 && stats.completed / stats.total > 0.5 ? (
//                         <TrendingUp className="w-4 h-4 text-white" />
//                       ) : (
//                         <Target className="w-4 h-4 text-white" />
//                       )}
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium text-yellow-800">
//                         {stats.total > 0 && stats.completed / stats.total > 0.8
//                           ? "Excellent Work!"
//                           : stats.total > 0 && stats.completed / stats.total > 0.5
//                           ? "Great Progress!"
//                           : "Keep Going!"}
//                       </p>
//                       <p className="text-xs text-yellow-600">
//                         {stats.total > 0 && stats.completed / stats.total > 0.8
//                           ? "You're crushing your tasks!"
//                           : stats.total > 0 && stats.completed / stats.total > 0.5
//                           ? "You're on the right track!"
//                           : "Every task completed is progress!"}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Task Breakdown */}
//             <Card>
//               <CardHeader className="pb-4">
//                 <CardTitle className="flex items-center gap-2">
//                   <BarChart3 className="h-5 w-5 text-gray-600" />
//                   Task Breakdown
//                 </CardTitle>
//                 <CardDescription>
//                   Detailed view of your task distribution
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="space-y-3">
//                   <div className="flex justify-between items-center">
//                     <div className="flex items-center gap-2">
//                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//                       <span className="text-sm text-gray-700">Completed</span>
//                     </div>
//                     <span className="text-sm font-semibold text-gray-900">
//                       {stats.completed}
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <div className="flex items-center gap-2">
//                       <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
//                       <span className="text-sm text-gray-700">
//                         In Progress
//                       </span>
//                     </div>
//                     <span className="text-sm font-semibold text-gray-900">
//                       {stats.inProgress}
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <div className="flex items-center gap-2">
//                       <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
//                       <span className="text-sm text-gray-700">Pending</span>
//                     </div>
//                     <span className="text-sm font-semibold text-gray-900">
//                       {stats.pending}
//                     </span>
//                   </div>
//                   {stats.overdue > 0 && (
//                     <div className="flex justify-between items-center">
//                       <div className="flex items-center gap-2">
//                         <div className="w-3 h-3 bg-red-500 rounded-full"></div>
//                         <span className="text-sm text-gray-700">Overdue</span>
//                       </div>
//                       <span className="text-sm font-semibold text-red-600">
//                         {stats.overdue}
//                       </span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="pt-3 border-t border-gray-100">
//                   <div className="text-center">
//                     <p className="text-sm text-gray-600">
//                       Focus on completing {stats.inProgress + stats.pending}{" "}
//                       remaining tasks
//                     </p>
//                     {stats.overdue > 0 && (
//                       <p className="text-xs text-red-600 mt-1">
//                         {stats.overdue} task{stats.overdue !== 1 ? "s" : ""}{" "}
//                         need immediate attention
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}
//       </div>

//       {/* Progress Update Modal */}
//       {progressModalOpen && (
//   <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
//     <div
//       className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300"
//       role="dialog"
//       aria-labelledby="progress-modal-title"
//       aria-describedby="progress-modal-description"
//     >
//       {/* Header - Fixed height */}
//       <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
//         <div className="flex items-center gap-3 mb-2">
//           <div className="p-2 bg-yellow-100 rounded-lg">
//             <Activity className="h-5 w-5 text-yellow-700" />
//           </div>
//           <div>
//             <h2
//               id="progress-modal-title"
//               className="text-xl font-semibold text-gray-900"
//             >
//               Update Progress
//             </h2>
//             <p
//               id="progress-modal-description"
//               className="text-gray-600 text-sm mt-1"
//             >
//               Update your progress for:{" "}
//               <strong className="text-gray-800">
//                 {selectedTask?.title}
//               </strong>
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Content - Scrollable area */}
//       <div className="flex-1 overflow-y-auto p-6 space-y-6">
//         {/* Progress Slider */}
//         <div className="space-y-4">
//           <div className="flex items-center justify-between">
//             <label
//               htmlFor="progress-slider"
//               className="block text-sm font-medium text-gray-700"
//             >
//               Progress
//             </label>
//             <span className="text-lg font-semibold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
//               {progressPercentage}%
//             </span>
//           </div>

//           <div className="space-y-3">
//             <input
//               id="progress-slider"
//               type="range"
//               min={selectedTask?.progress || 0}
//               max="100"
//               step="5"
//               value={progressPercentage}
//               onChange={(e) =>
//                 setProgressPercentage(parseInt(e.target.value))
//               }
//               className="w-full h-3 bg-gradient-to-r from-gray-200 via-yellow-200 to-yellow-500 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:bg-yellow-700 [&::-webkit-slider-thumb]:transition-colors"
//               aria-valuetext={`${progressPercentage} percent`}
//             />

//             <div className="flex justify-between text-xs text-gray-500 px-1">
//               {[0, 25, 50, 75, 100].map((value) => (
//                 <button
//                   key={value}
//                   type="button"
//                   onClick={() => setProgressPercentage(value)}
//                   className={`px-2 py-1 rounded transition-colors ${
//                     progressPercentage === value
//                       ? "bg-yellow-100 text-yellow-700 font-medium"
//                       : "hover:bg-gray-100"
//                   }`}
//                   disabled={value < (selectedTask?.progress || 0)}
//                 >
//                   {value}%
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Progress Comments */}
//         <div className="space-y-3">
//           <div className="flex items-center justify-between">
//             <label
//               htmlFor="progress-comments"
//               className="block text-sm font-medium text-gray-700"
//             >
//               Progress Comments
//             </label>
//             <span
//               className={`text-xs ${
//                 progressComments.length > 200
//                   ? "text-red-500"
//                   : "text-gray-400"
//               }`}
//             >
//               {progressComments.length}/200
//             </span>
//           </div>
//           <textarea
//             id="progress-comments"
//             placeholder="What have you completed? Any updates, achievements, or blockers you're facing?"
//             value={progressComments}
//             onChange={(e) =>
//               setProgressComments(e.target.value.slice(0, 200))
//             }
//             maxLength={200}
//             className="w-full min-h-[100px] p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-vertical transition-all duration-200 bg-white hover:border-gray-400"
//           />
//         </div>

//         {/* Progress Preview */}
//         <div className="bg-gradient-to-r from-gray-50 to-amber-50 rounded-xl p-4 space-y-3 border border-gray-200">
//           <div className="flex justify-between items-center text-sm">
//             <span className="font-semibold text-gray-700">
//               Progress Preview
//             </span>
//             <div className="flex items-center gap-2">
//               <span className="text-yellow-700 font-semibold">
//                 {progressPercentage}%
//               </span>
//               <span
//                 className={`px-2 py-1 rounded-full text-xs font-medium ${
//                   progressPercentage === 0
//                     ? "bg-gray-200 text-gray-600"
//                     : progressPercentage < 50
//                     ? "bg-yellow-100 text-yellow-700"
//                     : progressPercentage < 100
//                     ? "bg-blue-100 text-blue-700"
//                     : "bg-green-100 text-green-700"
//                 }`}
//               >
//                 {progressPercentage === 0
//                   ? "Not Started"
//                   : progressPercentage < 50
//                   ? "In Progress"
//                   : progressPercentage < 100
//                   ? "Almost Done"
//                   : "Completed"}
//               </span>
//             </div>
//           </div>

//           <div className="space-y-2">
//             <div className="w-full bg-white border border-gray-300 rounded-full h-3 overflow-hidden">
//               <div
//                 className={`h-3 rounded-full transition-all duration-500 ease-out ${
//                   progressPercentage === 0
//                     ? "bg-gray-400"
//                     : progressPercentage < 50
//                     ? "bg-yellow-500"
//                     : progressPercentage < 100
//                     ? "bg-blue-500"
//                     : "bg-green-500"
//                 }`}
//                 style={{ width: `${progressPercentage}%` }}
//               />
//             </div>
//             <div className="flex justify-between text-xs text-gray-500">
//               <span>Start</span>
//               <span>Complete</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer - Fixed at bottom */}
//       <div className="flex-shrink-0 flex gap-3 justify-end p-6 border-t border-gray-200 bg-gray-50">
//         <Button
//           variant="outline"
//           onClick={() => {
//             setProgressModalOpen(false);
//             setSelectedTask(null);
//             setProgressPercentage(0);
//             setProgressComments("");
//           }}
//           className="min-w-[80px] px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-100"
//         >
//           Cancel
//         </Button>
//         <Button
//           onClick={handleProgressSubmit}
//           disabled={
//             (progressPercentage < 100 && !progressComments.trim()) || 
//             progressPercentage === (selectedTask?.progress || 0)
//           }
//           className="min-w-[140px] px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           <Activity className="h-4 w-4 mr-2" />
//           Update Progress
//         </Button>
//       </div>
//     </div>
//   </div>
// )}

//       {/* Task Details Modal */}
//       {detailsModalOpen && selectedTaskDetails && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
//             <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-blue-100 rounded-lg">
//                     <FileText className="h-5 w-5 text-blue-700" />
//                   </div>
//                   <div>
//                     <h2 className="text-xl font-semibold text-gray-900">{selectedTaskDetails.title}</h2>
//                     <p className="text-gray-600 text-sm mt-1">Task details and progress history</p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => setDetailsModalOpen(false)}
//                   className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               </div>
//             </div>

//             <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
//               {/* Task Overview */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-4">
//                   <div>
//                     <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
//                       <FileText className="h-4 w-4" />
//                       Description
//                     </h3>
//                     <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-[80px]">
//                       {selectedTaskDetails.description}
//                     </p>
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <h4 className="text-sm font-medium text-gray-700 mb-1">Status</h4>
//                       {getStatusBadge(selectedTaskDetails.status, selectedTaskDetails.completedAt)}
//                     </div>
//                     <div>
//                       <h4 className="text-sm font-medium text-gray-700 mb-1">Priority</h4>
//                       {getPriorityBadge(selectedTaskDetails.priority)}
//                     </div>
//                     <div>
//                       <h4 className="text-sm font-medium text-gray-700 mb-1">Due Date</h4>
//                       <p className="text-gray-900 font-medium">{formatDate(selectedTaskDetails.dueDate)}</p>
//                     </div>
//                     <div>
//                       <h4 className="text-sm font-medium text-gray-700 mb-1">Category</h4>
//                       <Badge className="bg-gray-100 text-gray-700 border border-gray-200">
//                         {selectedTaskDetails.category || "Uncategorized"}
//                       </Badge>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Progress Section */}
//                 <div className="space-y-4">
//                   <div>
//                     <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
//                       <BarChart className="h-4 w-4" />
//                       Progress Overview
//                     </h3>
//                     <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
//                       <div className="flex justify-between items-center mb-2">
//                         <span className="font-medium text-gray-700">Current Progress</span>
//                         <span className="text-lg font-semibold text-blue-600">
//                           {selectedTaskDetails.progress || 0}%
//                         </span>
//                       </div>
//                       <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
//                         <div
//                           className={`h-3 rounded-full transition-all duration-500 ${
//                             (selectedTaskDetails.progress || 0) === 0 ? "bg-gray-400" :
//                             (selectedTaskDetails.progress || 0) < 50 ? "bg-yellow-500" :
//                             (selectedTaskDetails.progress || 0) < 100 ? "bg-blue-500" : "bg-green-500"
//                           }`}
//                           style={{ width: `${selectedTaskDetails.progress || 0}%` }}
//                         />
//                       </div>
//                       {selectedTaskDetails.status !== "Completed" && (
//                         <Button
//                           onClick={() => {
//                             setSelectedTask(selectedTaskDetails);
//                             setProgressPercentage(selectedTaskDetails.progress || 0);
//                             setProgressComments("");
//                             setProgressModalOpen(true);
//                             setDetailsModalOpen(false);
//                           }}
//                           className="w-full bg-yellow-500 hover:bg-yellow-600 text-white p-1.5 "
//                         >
//                           <Edit className="h-4 w-4 mr-2" />
//                           Update Progress
//                         </Button>
//                       )}
//                     </div>
//                   </div>

//                   {/* Progress Timeline */}
//                   <div>
//                     <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
//                       <History className="h-4 w-4" />
//                       Progress History
//                     </h3>
//                     <ProgressHistory progressComments={selectedTaskDetails.progressComments} />
//                   </div>
//                 </div>
//               </div>

//               {/* Additional Task Information */}
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
//                 <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
//                   <CalendarDays className="h-5 w-5 text-blue-600" />
//                   <div>
//                     <p className="text-sm font-medium text-gray-700">Created</p>
//                     <p className="text-gray-900">{formatDateTime(selectedTaskDetails.createdAt)}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
//                   <Clock4 className="h-5 w-5 text-green-600" />
//                   <div>
//                     <p className="text-sm font-medium text-gray-700">Last Updated</p>
//                     <p className="text-gray-900">{formatDateTime(selectedTaskDetails.updatedAt)}</p>
//                   </div>
//                 </div>
//                 {selectedTaskDetails.estimatedHours && (
//                   <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
//                     <TargetIcon className="h-5 w-5 text-purple-600" />
//                     <div>
//                       <p className="text-sm font-medium text-gray-700">Estimated Hours</p>
//                       <p className="text-gray-900">{selectedTaskDetails.estimatedHours}h</p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Target,
  TrendingUp,
  Award,
  Zap,
  Filter,
  Search,
  Plus,
  FileText,
  Bell,
  Star,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Activity,
  Timer,
  BarChart3,
  RefreshCw,
  X,
  SlidersHorizontal,
  Grid3X3,
  List,
  Focus,
  Flame,
  Coffee,
  Brain,
  Edit,
  History,
  BarChart,
  TargetIcon,
  CalendarDays,
  Clock4,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/context/SessionContext";

export default function MyTasks() {
  const { user } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    inProgress: 0,
    todayDue: 0,
    thisWeekDue: 0,
  });
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [error, setError] = useState("");
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [progressComments, setProgressComments] = useState("");
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(9); // Default items per page

  /**
   * MEMOIZED FILTERING & SORTING LOGIC
   * This hook handles all filtering and sorting (newest first) based on state changes.
   */
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // 1. Search Term Filtering
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(task =>
        task.title.toLowerCase().includes(term) ||
        (task.description && task.description.toLowerCase().includes(term)) ||
        (task.tags && task.tags.some(t => t.toLowerCase().includes(term)))
      );
    }

    // Prepare date for special filters
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 2. Special Filters (Overdue and Today) - applied before general status filter
    if (filter === "overdue") {
      result = result.filter(task => {
        if (task.status === "Completed" || !task.dueDate) return false;
        return new Date(task.dueDate) < today;
      });
    } else if (filter === "today") {
      result = result.filter(task => {
        if (task.status === "Completed" || !task.dueDate) return false;
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        return due.getTime() === today.getTime(); // Check if due date is exactly today
      });
    } else if (filter !== "all") {
      // 3. General Status Filtering
      result = result.filter(task => task.status === filter);
    }

    // 4. Priority Filtering
    if (priorityFilter) {
      result = result.filter(task => task.priority === priorityFilter);
    }

    // 5. Sorting: Latest task at the top (by createdAt descending)
    result.sort((a, b) => {
        // Handle null/undefined dates by pushing them to the bottom
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        
        // Sort descending (b - a for newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [tasks, searchTerm, filter, priorityFilter]);

  // Pagination calculations
  const paginationData = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const totalPages = Math.ceil(totalTasks / tasksPerPage);
    
    // Calculate current page tasks
    const startIndex = (currentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    const currentTasks = filteredTasks.slice(startIndex, endIndex);

    return {
      totalTasks,
      totalPages,
      currentTasks,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalTasks),
      hasPrevious: currentPage > 1,
      hasNext: currentPage < totalPages,
    };
  }, [filteredTasks, currentPage, tasksPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, priorityFilter, tasksPerPage]);

  useEffect(() => {
    console.log("🔄 MyTasks component mounted, user:", user);
    if (user) {
      fetchMyTasks();
    } else {
        if (!user) {
          setError("User session not available. Please log in again.");
        }
    }
  }, [user]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      setError("");

      if (!user || !user.id) {
        throw new Error("User not authenticated");
      }

      const response = await fetch("/api/tasks");
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }

      const data = await response.json();
      const allTasks = data.data || [];

      let assignedTasks = [];
      if (user.role === "admin") {
        // Admins see all tasks
        assignedTasks = allTasks; 
      } else if (user.role === "Employee") {
        // Employees see tasks assigned to them
        assignedTasks = allTasks?.filter((task) => {
          if (!task?.assignedTo) return false;
          // Handles both populated and unpopulated assignedTo fields
          const assignedToId = task.assignedTo._id?.toString() || task.assignedTo.toString();
          const userId = user.id?.toString();
          return assignedToId === userId;
        });
      } else if (user.role === "Supervisor") {
        // Supervisors see tasks they assigned
        assignedTasks = allTasks.filter((task) => {
          const assignedById = task.assignedBy?.toString();
          const userId = user.id.toString();
          return assignedById === userId;
        });
      }

      setTasks(assignedTasks);
      calculateStats(assignedTasks);
    } catch (err) {
      console.error("❌ Error in fetchMyTasks:", err);
      setError(err.message || "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (taskList) => {
    if (!taskList || !Array.isArray(taskList)) {
      setStats({
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        inProgress: 0,
        todayDue: 0,
        thisWeekDue: 0,
      });
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get the start of the current week (Sunday)
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay()); 

    // Get the end of the current week (Saturday midnight)
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 7);

    const newStats = {
      total: taskList.length,
      completed: taskList.filter((task) => task.status === "Completed").length,
      pending: taskList.filter((task) => task.status === "Pending").length,
      
      // Calculate overdue based on tasks not completed and due date passed
      overdue: taskList.filter(
        (task) =>
          task.status !== "Completed" &&
          task.dueDate &&
          new Date(task.dueDate) < today
      ).length,

      inProgress: taskList.filter((task) => task.status === "In Progress").length,
      
      // Calculate tasks due today (due date matches today)
      todayDue: taskList.filter(
        (task) =>
          task.status !== "Completed" &&
          task.dueDate &&
          new Date(task.dueDate).toDateString() === today.toDateString()
      ).length,

      // Calculate tasks due this week (due date >= today AND < last day of week)
      thisWeekDue: taskList.filter(
        (task) =>
          task.status !== "Completed" &&
          task.dueDate &&
          new Date(task.dueDate) >= today && 
          new Date(task.dueDate) < lastDayOfWeek
      ).length,
    };

    setStats(newStats);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMyTasks();
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTasksPerPageChange = (value) => {
    setTasksPerPage(Number(value));
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

  const handleStatusUpdate = (task) => {
    if (!task || !task._id) {
      setError("Cannot update task: Invalid task data");
      return;
    }

    // If task is pending, start it with 0% progress
    if (task.status === "Pending") {
      handleProgressUpdate(task._id, 0, "Started working on the task");
    } 
    // If task is already in progress, show progress modal to update it
    else if (task.status === "In Progress" && (task.progress || 0) < 100) {
      setSelectedTask(task);
      setProgressPercentage(task.progress || 0);
      setProgressComments("");
      setProgressModalOpen(true);
    } 
    // If progress is already 100%, allow completion
    else if (task.status === "In Progress" && (task.progress || 0) >= 100) {
      handleStatusChange(task._id, "Completed");
    }
  };

  const handleProgressUpdate = async (taskId, progress, comments = "") => {
    try {
      setError("");
      
      const updateData = {
        progress: progress,
        lastUpdated: new Date().toISOString(),
      };

      // Add progress comment if provided
      if (comments) {
        // Find the current task details to preserve existing comments
        const currentTask = tasks.find(t => t._id === taskId);

        updateData.progressComments = [
          ...(currentTask?.progressComments || []), 
          {
            comment: comments,
            progress: progress,
            date: new Date().toISOString()
          }
        ];
      }

      // Update status based on progress
      if (progress === 0 && selectedTask?.status === "Pending") {
        updateData.status = "In Progress";
      } else if (progress === 100) {
        updateData.status = "Completed";
        updateData.completedAt = new Date().toISOString();
      } else if (progress > 0 && progress < 100) {
        updateData.status = "In Progress";
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.success || !data.task) {
          throw new Error(data.error || "Invalid response: Missing task data");
        }

        const updatedTask = data.task;
        
        // Update local state with the new task
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task._id === taskId ? updatedTask : task
          )
        );
        
        // Recalculate stats with the fully updated list
        const updatedTasksList = tasks.map(task => 
          task._id === taskId ? updatedTask : task
        );
        calculateStats(updatedTasksList);

        setProgressModalOpen(false);
        setSelectedTask(null);
        setProgressPercentage(0);
        setProgressComments("");
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to update task progress");
      }
    } catch (error) {
      console.error("❌ Error updating task progress:", error);
      setError(`Error updating task progress: ${error.message}`);
    }
  };

  const handleProgressSubmit = async () => {
    if (!selectedTask || !selectedTask._id) {
      setError("No task selected for update");
      return;
    }

    await handleProgressUpdate(selectedTask._id, progressPercentage, progressComments);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    if (!taskId || taskId === "undefined" || taskId === "") {
      setError("Cannot update task: Invalid task ID");
      return;
    }

    try {
      setError("");

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          ...(newStatus === "Completed" && {
            completedAt: new Date().toISOString(),
            progress: 100,
          }),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.success || !data.task) {
          throw new Error(data.error || "Invalid response: Missing task data");
        }

        const updatedTask = data.task;
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task._id === taskId ? updatedTask : task))
        );
        
        const updatedTasks = tasks.map(task => 
          task._id === taskId ? updatedTask : task
        );
        calculateStats(updatedTasks);
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to update task status");
      }
    } catch (error) {
      console.error("❌ Error updating task status:", error);
      setError(`Error updating task status: ${error.message}`);
      // Re-fetch in case of failure to ensure data consistency
      await fetchMyTasks(); 
    }
  };

  const handleViewDetails = (task) => {
    setSelectedTaskDetails(task);
    setDetailsModalOpen(true);
  };

  const getStatusBadge = (status, completedAt = null) => {
    const statusConfig = {
      Pending: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock,
      },
      "In Progress": {
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: Activity,
      },
      Completed: {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: CheckCircle2,
      },
      Blocked: {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: AlertCircle,
      },
      Deferred: {
        color: "bg-slate-50 text-slate-700 border-slate-200",
        icon: Clock,
      },
    };

    const { color, icon: Icon } = statusConfig[status] || statusConfig.Pending;

    const formatTime = (dateString) => {
      if (!dateString) return null;
      return new Date(dateString).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    const timeText = status === "Completed" && completedAt ? formatTime(completedAt) : null;
    const displayText = status === "Completed" && timeText ? `Completed at ${timeText}` : status;

    const badgeClass = `${color} border flex items-center gap-1.5 font-medium text-xs px-2 py-1 rounded-full`;

    return (
      <Badge className={badgeClass}>
        <Icon className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{displayText}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityColors = {
      Low: "bg-slate-50 text-slate-600 border-slate-200",
      Medium: "bg-yellow-50 text-yellow-600 border-yellow-200",
      High: "bg-orange-50 text-orange-600 border-orange-200",
      Urgent: "bg-red-50 text-red-600 border-red-200",
    };

    const priorityIcons = {
      Low: <ArrowDown className="h-3 w-3" />,
      Medium: <div className="w-3 h-3 rounded-full bg-current opacity-60"></div>,
      High: <ArrowUp className="h-3 w-3" />,
      Urgent: <Zap className="h-3 w-3" />,
    };

    return (
      <Badge className={`${priorityColors[priority]} border flex items-center gap-1.5 font-medium text-xs px-2 py-1 rounded-full`}>
        {priorityIcons[priority]}
        {priority}
      </Badge>
    );
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    return due < today;
  };

  const formatDate = (date) => {
    if (!date) return "No due date";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilter("all");
    setPriorityFilter("");
  };

  const activeFiltersCount = [
    searchTerm,
    filter !== "all" ? filter : "",
    priorityFilter,
  ].filter(Boolean).length;

  // Enhanced Task Card Component
  const TaskCard = ({ task }) => {
    const isTaskOverdue = isOverdue(task.dueDate);
    const progress = task.progress || 0;

    return (
      <Card className={`group hover:shadow-lg transition-all duration-200 ${task.status === "Completed" ? "opacity-80" : ""} ${isTaskOverdue && task.status !== "Completed" ? "ring-2 ring-red-200 bg-red-50/30" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors line-clamp-1 mb-1">
                {task.title}
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 line-clamp-2">
                {task.description}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
              {getStatusBadge(task.status, task.completedAt)}
              {getPriorityBadge(task.priority)}
              {isTaskOverdue && task.status !== "Completed" && (
                <Badge className="bg-red-50 text-red-600 border-red-200 border font-medium animate-pulse text-xs px-2 py-0.5">
                  <AlertCircle className="h-2.5 w-2.5 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-700">Progress</span>
              <span className="text-xs font-bold text-yellow-600">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  progress === 0 ? "bg-gray-400" :
                  progress < 50 ? "bg-yellow-500" :
                  progress < 100 ? "bg-blue-500" : "bg-green-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {task.status === "In Progress" && progress < 100 && (
              <div className="flex gap-1">
                {[25, 50, 75, 100].map((value) => (
                  <button
                    key={value}
                    onClick={() => {
                      setSelectedTask(task);
                      setProgressPercentage(value);
                      setProgressComments("");
                      setProgressModalOpen(true);
                    }}
                    className={`flex-1 text-xs py-1 px-2 rounded border transition-colors ${
                      value <= progress
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                    }`}
                    disabled={value <= progress}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Task Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span className={`font-medium ${
                isTaskOverdue && task.status !== "Completed"
                  ? "text-red-600"
                  : "text-gray-700"
              }`}>
                {formatDate(task.dueDate)}
                {isTaskOverdue && task.status !== "Completed" && (
                  <span className="ml-1 text-red-500 font-semibold">(Overdue)</span>
                )}
              </span>
            </div>
            {task.estimatedHours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{task.estimatedHours}h</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {task.category && (
              <Badge className="bg-gray-50 text-gray-700 border-gray-200 border font-medium text-xs px-2 py-0.5">
                {task.category}
              </Badge>
            )}
            {task.tags && task.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} className="bg-yellow-50 text-yellow-700 border-yellow-200 border font-medium text-xs px-2 py-0.5">
                #{tag}
              </Badge>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            {task.status !== "Completed" ? (
              <Button
                size="sm"
                className={`${
                  task.status === "In Progress"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-yellow-500 hover:bg-yellow-600"
                } text-white shadow-sm px-3 py-1.5 font-medium flex-1 h-8
                flex justify-center items-center whitespace-nowrap`}
                onClick={() => handleStatusUpdate(task)}
              >
                {task.status === "In Progress" && progress < 100 ? (
                  <>
                    <Edit className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Update Progress</span>
                  </>
                ) : task.status === "In Progress" && progress >= 100 ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Mark Completed</span>
                  </>
                ) : (
                  <>
                    <Activity className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Start Progress</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white shadow-sm px-3 py-2 font-medium flex items-center justify-center min-h-[32px] opacity-90 cursor-default"
                disabled
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Task Completed
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 px-3 py-1.5 font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => handleViewDetails(task)}
            >
              <FileText className="h-3 w-3 mr-1" />
              Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Progress History Component
  const ProgressHistory = ({ progressComments }) => {
    if (!progressComments || !Array.isArray(progressComments) || progressComments.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No progress updates yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {progressComments.map((update, index) => (
          <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">{update.progress}%</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-gray-900">Progress updated to {update.progress}%</span>
                <span className="text-xs text-gray-500">
                  {formatDateTime(update.date)}
                </span>
              </div>
              {update.comment && (
                <p className="text-sm text-gray-700">{update.comment}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Pagination Component
  const Pagination = () => {
    const { totalPages, currentTasks, startIndex, endIndex, totalTasks, hasPrevious, hasNext } = paginationData;
    
    if (totalPages <= 1) return null;

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-4 bg-white rounded-lg border border-gray-200">
        {/* Items per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <select
            value={tasksPerPage}
            onChange={(e) => handleTasksPerPageChange(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value={6}>6</option>
            <option value={9}>9</option>
            <option value={12}>12</option>
            <option value={18}>18</option>
            <option value={24}>24</option>
          </select>
          <span className="text-sm text-gray-600">tasks per page</span>
        </div>

        {/* Page info */}
        <div className="text-sm text-gray-600">
          Showing {startIndex} to {endIndex} of {totalTasks} tasks
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-1">
          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevious}
            className="h-9 w-9 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          {pageNumbers.map((page, index) => (
            <div key={index}>
              {page === "..." ? (
                <span className="flex items-center justify-center h-9 w-9 text-sm text-gray-500">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className={`h-9 w-9 p-0 ${
                    currentPage === page 
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white" 
                      : ""
                  }`}
                >
                  {page}
                </Button>
              )}
            </div>
          ))}

          {/* Next button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext}
            className="h-9 w-9 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  Error Loading Tasks
                </h3>
                <p className="text-red-700">{error}</p>
                <p className="text-red-600 text-sm mt-2">
                  Please check your browser console for more details.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={fetchMyTasks}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Try Again
              </Button>
              <Button onClick={() => setError("")} variant="outline">
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
                <p className="text-gray-600 text-sm mt-0.5">
                  Loading your personal task dashboard...
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-200 border-t-yellow-500"></div>
              <p className="text-gray-600 font-medium">
                Loading your tasks...
              </p>
              <p className="text-gray-500 text-sm">
                Checking database connection...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
                <p className="text-gray-600 text-sm mt-0.5">
                  {tasks.length > 0
                    ? `You have ${tasks.length} total task${tasks.length !== 1 ? "s" : ""} assigned`
                    : "Your personal task dashboard"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh tasks"
              >
                <RefreshCw
                  className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>

              {(user?.role === "admin" || user?.role === "Supervisor") && (
                <Link href="/tasks/create">
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm px-6 py-2.5 font-semibold">
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Statistics Dashboard */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                    <BarChart3 className="w-4 h-4 text-yellow-600" />
                  </div>
                  Personal Dashboard
                </CardTitle>
                <CardDescription>
                  Track your productivity and task completion progress
                </CardDescription>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 px-6 pb-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-gray-600" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Tasks
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total}
                </p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-yellow-600" />
                  </div>
                  <Focus className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-yellow-600 text-sm font-medium">
                  In Progress
                </p>
                <p className="text-2xl font-semibold text-yellow-700">
                  {stats.inProgress}
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <Timer className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-amber-600 text-sm font-medium">Pending</p>
                <p className="text-2xl font-semibold text-amber-700">
                  {stats.pending}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    {stats.total > 0
                      ? Math.round((stats.completed / stats.total) * 100)
                      : 0}
                    %
                  </div>
                </div>
                <p className="text-green-600 text-sm font-medium">Completed</p>
                <p className="text-2xl font-semibold text-green-700">
                  {stats.completed}
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  {stats.overdue > 0 && (
                    <Bell className="w-4 h-4 text-red-500 animate-pulse" />
                  )}
                </div>
                <p className="text-red-600 text-sm font-medium">Overdue</p>
                <p className="text-2xl font-semibold text-red-700">
                  {stats.overdue}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  {stats.todayDue > 0 && (
                    <Star className="w-4 h-4 text-purple-500" />
                  )}
                </div>
                <p className="text-purple-600 text-sm font-medium">Due Today</p>
                <p className="text-2xl font-semibold text-purple-700">
                  {stats.todayDue}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Flame className="w-5 h-5 text-blue-600" />
                  </div>
                  <Coffee className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-blue-600 text-sm font-medium">This Week</p>
                <p className="text-2xl font-semibold text-blue-700">
                  {stats.thisWeekDue}
                </p>
              </div>
            </div>

            {/* Quick Actions & Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stats.overdue > 0 && (
                    <button
                      onClick={() => setFilter("overdue")}
                      className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      Focus on Overdue ({stats.overdue})
                    </button>
                  )}
                  {stats.todayDue > 0 && (
                    <button
                      onClick={() => setFilter("today")}
                      className="px-3 py-1.5 bg-purple-50 text-purple-600 text-sm rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      Today's Tasks ({stats.todayDue})
                    </button>
                  )}
                  <button
                    onClick={() => setFilter("In Progress")}
                    className="px-3 py-1.5 bg-yellow-50 text-yellow-600 text-sm rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors"
                  >
                    Continue Working ({stats.inProgress})
                  </button>
                </div>
              </div>

              {/* Productivity Insight */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Productivity Insight
                </h3>
                <div className="bg-gradient-to-r from-yellow-50 to-blue-50 p-3 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      {stats.total > 0 && stats.completed / stats.total > 0.7
                        ? "Excellent Progress!"
                        : stats.total > 0 && stats.completed / stats.total > 0.5
                        ? "Good Momentum!"
                        : "Keep Going!"}
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700">
                    {stats.total > 0
                      ? Math.round((stats.completed / stats.total) * 100)
                      : 0}
                    % completion rate
                    {stats.overdue > 0 &&
                      ` • ${stats.overdue} tasks need attention`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                  <SlidersHorizontal className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Filter & Search</CardTitle>
                  <CardDescription>
                    Find and organize your personal tasks
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                    {activeFiltersCount} filter
                    {activeFiltersCount !== 1 ? "s" : ""} active
                  </span>
                )}
                <div className="flex rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded transition-colors text-gray-600 ${
                      viewMode === "list"
                        ? "bg-yellow-100 text-yellow-600"
                        : "hover:text-yellow-600 hover:bg-yellow-50"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded transition-colors text-gray-600 ${
                      viewMode === "grid"
                        ? "bg-yellow-100 text-yellow-600"
                        : "hover:text-yellow-600 hover:bg-yellow-50"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Search Tasks
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search your tasks..."
                      className="pl-10 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Tasks</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="overdue">Overdue</option>
                    <option value="today">Due Today</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Deferred">Deferred</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 font-medium">
                    Showing {paginationData.currentTasks.length} of {paginationData.totalTasks} task{paginationData.totalTasks !== 1 ? "s" : ""}
                    {paginationData.totalPages > 1 && ` • Page ${currentPage} of ${paginationData.totalPages}`}
                  </span>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Display */}
        {paginationData.currentTasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-gray-400" />
              </div>
              <CardTitle className="text-xl mb-2">No tasks found</CardTitle>
              <CardDescription className="mb-6 max-w-md mx-auto">
                {activeFiltersCount > 0
                  ? "No tasks match your current filters. Try adjusting your search criteria."
                  : filter === "all"
                  ? "You don't have any tasks assigned yet. Create your first task to get started!"
                  : `No ${filter.toLowerCase()} tasks found.`}
              </CardDescription>
              <div className="flex items-center justify-center space-x-3">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="px-6 py-2.5 font-medium"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
                {(user?.role === "admin" || user?.role === "Supervisor") && (
                  <Link href="/tasks/create">
                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm px-6 py-2.5 font-semibold">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Task
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-6"
              }
            >
              {/* Uses paginated tasks */}
              {paginationData.currentTasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
            </div>

            {/* Pagination Component */}
            <Pagination />
          </>
        )}

        {/* Completion Progress */}
        {stats.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Completion Rate Card */}
            <Card className="bg-gradient-to-br from-yellow-50 to-blue-50 border-yellow-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <Award className="h-5 w-5" />
                  Completion Progress
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  Track your productivity and achievement rate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-yellow-800">
                      Completion Rate
                    </span>
                    <span className="font-semibold text-yellow-900">
                      {stats.total > 0
                        ? Math.round((stats.completed / stats.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-yellow-500 to-blue-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                      style={{
                        width: `${
                          stats.total > 0
                            ? (stats.completed / stats.total) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-yellow-700">
                    <span>{stats.completed} completed</span>
                    <span>{stats.total - stats.completed} remaining</span>
                  </div>
                </div>

                {/* Achievement Badge */}
                <div className="pt-3 border-t border-yellow-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      {stats.total > 0 && stats.completed / stats.total > 0.8 ? (
                        <Star className="w-4 h-4 text-white" />
                      ) : stats.total > 0 && stats.completed / stats.total > 0.5 ? (
                        <TrendingUp className="w-4 h-4 text-white" />
                      ) : (
                        <Target className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        {stats.total > 0 && stats.completed / stats.total > 0.8
                          ? "Excellent Work!"
                          : stats.total > 0 && stats.completed / stats.total > 0.5
                          ? "Great Progress!"
                          : "Keep Going!"}
                      </p>
                      <p className="text-xs text-yellow-600">
                        {stats.total > 0 && stats.completed / stats.total > 0.8
                          ? "You're crushing your tasks!"
                          : stats.total > 0 && stats.completed / stats.total > 0.5
                          ? "You're on the right track!"
                          : "Every task completed is progress!"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Breakdown */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gray-600" />
                  Task Breakdown
                </CardTitle>
                <CardDescription>
                  Detailed view of your task distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Completed</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.completed}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">
                        In Progress
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.inProgress}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Pending</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.pending}
                    </span>
                  </div>
                  {stats.overdue > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Overdue</span>
                      </div>
                      <span className="text-sm font-semibold text-red-600">
                        {stats.overdue}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Focus on completing {stats.inProgress + stats.pending}{" "}
                      remaining tasks
                    </p>
                    {stats.overdue > 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        {stats.overdue} task{stats.overdue !== 1 ? "s" : ""}{" "}
                        need immediate attention
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Progress Update Modal */}
      {progressModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300"
            role="dialog"
            aria-labelledby="progress-modal-title"
            aria-describedby="progress-modal-description"
          >
            {/* Header - Fixed height */}
            <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Activity className="h-5 w-5 text-yellow-700" />
                </div>
                <div>
                  <h2
                    id="progress-modal-title"
                    className="text-xl font-semibold text-gray-900"
                  >
                    Update Progress
                  </h2>
                  <p
                    id="progress-modal-description"
                    className="text-gray-600 text-sm mt-1"
                  >
                    Update your progress for:{" "}
                    <strong className="text-gray-800">
                      {selectedTask?.title}
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Content - Scrollable area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Progress Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="progress-slider"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Progress
                  </label>
                  <span className="text-lg font-semibold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                    {progressPercentage}%
                  </span>
                </div>

                <div className="space-y-3">
                  <input
                    id="progress-slider"
                    type="range"
                    min={selectedTask?.progress || 0}
                    max="100"
                    step="5"
                    value={progressPercentage}
                    onChange={(e) =>
                      setProgressPercentage(parseInt(e.target.value))
                    }
                    className="w-full h-3 bg-gradient-to-r from-gray-200 via-yellow-200 to-yellow-500 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:bg-yellow-700 [&::-webkit-slider-thumb]:transition-colors"
                    aria-valuetext={`${progressPercentage} percent`}
                  />

                  <div className="flex justify-between text-xs text-gray-500 px-1">
                    {[0, 25, 50, 75, 100].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setProgressPercentage(value)}
                        className={`px-2 py-1 rounded transition-colors ${
                          progressPercentage === value
                            ? "bg-yellow-100 text-yellow-700 font-medium"
                            : "hover:bg-gray-100"
                        }`}
                        disabled={value < (selectedTask?.progress || 0)}
                      >
                        {value}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Comments */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="progress-comments"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Progress Comments
                  </label>
                  <span
                    className={`text-xs ${
                      progressComments.length > 200
                        ? "text-red-500"
                        : "text-gray-400"
                    }`}
                  >
                    {progressComments.length}/200
                  </span>
                </div>
                <textarea
                  id="progress-comments"
                  placeholder="What have you completed? Any updates, achievements, or blockers you're facing?"
                  value={progressComments}
                  onChange={(e) =>
                    setProgressComments(e.target.value.slice(0, 200))
                  }
                  maxLength={200}
                  className="w-full min-h-[100px] p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-vertical transition-all duration-200 bg-white hover:border-gray-400"
                />
              </div>

              {/* Progress Preview */}
              <div className="bg-gradient-to-r from-gray-50 to-amber-50 rounded-xl p-4 space-y-3 border border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-700">
                    Progress Preview
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-700 font-semibold">
                      {progressPercentage}%
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        progressPercentage === 0
                          ? "bg-gray-200 text-gray-600"
                          : progressPercentage < 50
                          ? "bg-yellow-100 text-yellow-700"
                          : progressPercentage < 100
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {progressPercentage === 0
                        ? "Not Started"
                        : progressPercentage < 50
                        ? "In Progress"
                        : progressPercentage < 100
                        ? "Almost Done"
                        : "Completed"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-white border border-gray-300 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ease-out ${
                        progressPercentage === 0
                          ? "bg-gray-400"
                          : progressPercentage < 50
                          ? "bg-yellow-500"
                          : progressPercentage < 100
                          ? "bg-blue-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Start</span>
                    <span>Complete</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="flex-shrink-0 flex gap-3 justify-end p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={() => {
                  setProgressModalOpen(false);
                  setSelectedTask(null);
                  setProgressPercentage(0);
                  setProgressComments("");
                }}
                className="min-w-[80px] px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleProgressSubmit}
                disabled={
                  (progressPercentage < 100 && !progressComments.trim()) || 
                  progressPercentage === (selectedTask?.progress || 0)
                }
                className="min-w-[140px] px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Activity className="h-4 w-4 mr-2" />
                Update Progress
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {detailsModalOpen && selectedTaskDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedTaskDetails.title}</h2>
                    <p className="text-gray-600 text-sm mt-1">Task details and progress history</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Task Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Description
                    </h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-[80px]">
                      {selectedTaskDetails.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Status</h4>
                      {getStatusBadge(selectedTaskDetails.status, selectedTaskDetails.completedAt)}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Priority</h4>
                      {getPriorityBadge(selectedTaskDetails.priority)}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Due Date</h4>
                      <p className="text-gray-900 font-medium">{formatDate(selectedTaskDetails.dueDate)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Category</h4>
                      <Badge className="bg-gray-100 text-gray-700 border border-gray-200">
                        {selectedTaskDetails.category || "Uncategorized"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      Progress Overview
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700">Current Progress</span>
                        <span className="text-lg font-semibold text-blue-600">
                          {selectedTaskDetails.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            (selectedTaskDetails.progress || 0) === 0 ? "bg-gray-400" :
                            (selectedTaskDetails.progress || 0) < 50 ? "bg-yellow-500" :
                            (selectedTaskDetails.progress || 0) < 100 ? "bg-blue-500" : "bg-green-500"
                          }`}
                          style={{ width: `${selectedTaskDetails.progress || 0}%` }}
                        />
                      </div>
                      {selectedTaskDetails.status !== "Completed" && (
                        <Button
                          onClick={() => {
                            setSelectedTask(selectedTaskDetails);
                            setProgressPercentage(selectedTaskDetails.progress || 0);
                            setProgressComments("");
                            setProgressModalOpen(true);
                            setDetailsModalOpen(false);
                          }}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white p-1.5 "
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Update Progress
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress Timeline */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Progress History
                    </h3>
                    <ProgressHistory progressComments={selectedTaskDetails.progressComments} />
                  </div>
                </div>
              </div>

              {/* Additional Task Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Created</p>
                    <p className="text-gray-900">{formatDateTime(selectedTaskDetails.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock4 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Last Updated</p>
                    <p className="text-gray-900">{formatDateTime(selectedTaskDetails.updatedAt)}</p>
                  </div>
                </div>
                {selectedTaskDetails.estimatedHours && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <TargetIcon className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Estimated Hours</p>
                      <p className="text-gray-900">{selectedTaskDetails.estimatedHours}h</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}