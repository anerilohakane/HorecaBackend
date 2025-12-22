"use client";
import { useState, useEffect } from "react";
import {
  Edit,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Briefcase,
  CreditCard,
  FileText,
  Calculator,
  Shield,
  Download,
  MoreVertical,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Bank,
  IdCard,
  Plus,
  IndianRupee,
  Percent,
  Receipt,
  Loader2,
  Building2,
  Target,
  TrendingUp,
  CheckSquare,
  BarChart3,
  PieChart,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Users,
  FolderOpen,
  MessageSquare,
  Paperclip,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  TrendingDown,
  Award,
  Zap,
  CalendarDays,
  BarChart,
  LineChart,
  PieChart as PieChartIcon,
  Minus, // Added missing Minus icon
  UserCheck,
} from "lucide-react";
import { Bar, Pie, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Link from "next/link";
import { useRouter } from "next/navigation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Add missing Minus icon component at the top level
const MinusIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 12H4"
    />
  </svg>
);

// Move helper components outside the main component
const MetricCard = ({ title, value, icon: Icon, trend, color, subtitle }) => {
  const colorStyles = {
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4" />,
    down: <TrendingDown className="w-4 h-4" />,
    neutral: <MinusIcon className="w-4 h-4" />,
  };

  return (
    <div className={`p-4 rounded-xl border ${colorStyles[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end">
          <Icon className="w-8 h-8 opacity-70" />
          {trend && (
            <div
              className={`mt-2 flex items-center gap-1 text-xs ${
                trend === "up"
                  ? "text-green-600"
                  : trend === "down"
                  ? "text-red-600"
                  : "text-slate-600"
              }`}
            >
              {trendIcons[trend]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InsightItem = ({ title, value, type }) => {
  const getValueDisplay = () => {
    switch (type) {
      case "percentage":
        return `${value}%`;
      case "time":
        return value;
      case "trend":
        return (
          <span
            className={`flex items-center gap-1 ${
              value === "Improving"
                ? "text-green-600"
                : value === "Declining"
                ? "text-red-600"
                : "text-yellow-600"
            }`}
          >
            {value === "Improving" ? (
              <TrendingUp className="w-4 h-4" />
            ) : value === "Declining" ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <MinusIcon className="w-4 h-4" />
            )}
            {value}
          </span>
        );
      case "level":
        return (
          <span
            className={`font-medium ${
              value === "High"
                ? "text-green-600"
                : value === "Medium"
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {value}
          </span>
        );
      default:
        return value;
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-600">{title}</span>
      <span className="text-sm font-medium text-slate-900">
        {getValueDisplay()}
      </span>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon }) => (
  <div className="bg-slate-50 rounded-lg p-4">
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-slate-600" />
      <div>
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  </div>
);

// Helper Functions
const calculateAverageCompletionTime = (tasks) => {
  const completedTasks = tasks.filter(
    (task) => task.status === "Completed" && task.createdAt && task.updatedAt
  );

  if (completedTasks.length === 0) return "N/A";

  const totalTime = completedTasks.reduce((total, task) => {
    const start = new Date(task.createdAt);
    const end = new Date(task.updatedAt);
    return total + (end - start);
  }, 0);

  const avgDays = totalTime / completedTasks.length / (1000 * 60 * 60 * 24);
  return avgDays < 1 ? "<1 day" : `${Math.round(avgDays)} days`;
};

const calculateEfficiencyScore = (tasks) => {
  if (tasks.length === 0) return 0;

  const completedWeight =
    tasks.filter((t) => t.status === "Completed").length * 1;
  const inProgressWeight =
    tasks.filter((t) => t.status === "In Progress").length * 0.5;
  const overduePenalty =
    tasks.filter(
      (t) => t.status !== "Completed" && new Date(t.dueDate) < new Date()
    ).length * 0.2;

  const maxScore = tasks.length;
  const actualScore = completedWeight + inProgressWeight - overduePenalty;

  return Math.max(0, Math.min(100, Math.round((actualScore / maxScore) * 100)));
};

const generateTimelineData = (tasks, timeRange) => {
  // Simplified timeline data - in real app, you'd group by dates
  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];

  return {
    labels: weeks,
    datasets: [
      {
        label: "Tasks Completed",
        data: weeks.map(() => Math.floor(Math.random() * 10) + 1),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
      },
      {
        label: "Tasks Created",
        data: weeks.map(() => Math.floor(Math.random() * 10) + 1),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
    ],
  };
};

const generateCategoryData = (tasks) => {
  const categories = {};
  tasks.forEach((task) => {
    const category = task.category || "Uncategorized";
    categories[category] = (categories[category] || 0) + 1;
  });

  const sortedCategories = Object.entries(categories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return {
    labels: sortedCategories.map(([name]) => name),
    datasets: [
      {
        data: sortedCategories.map(([, count]) => count),
        backgroundColor: [
          "#8b5cf6",
          "#06b6d4",
          "#10b981",
          "#f59e0b",
          "#ef4444",
        ],
      },
    ],
  };
};

const calculateOnTimeRate = (tasks) => {
  const completedTasks = tasks.filter((task) => task.status === "Completed");
  if (completedTasks.length === 0) return 0;

  const onTimeTasks = completedTasks.filter((task) => {
    const completedDate = new Date(task.updatedAt);
    const dueDate = new Date(task.dueDate);
    return completedDate <= dueDate;
  });
  return Math.round((onTimeTasks.length / completedTasks.length) * 100);
};

const getCompletionTrend = (tasks) => {
  // Simplified trend calculation
  const recentCompletionRate = 75; // This would be calculated from recent data
  const previousCompletionRate = 60; // This would be from previous period

  if (recentCompletionRate > previousCompletionRate + 5) return "Improving";
  if (recentCompletionRate < previousCompletionRate - 5) return "Declining";
  return "Stable";
};

const getProductivityLevel = (efficiencyScore) => {
  if (efficiencyScore >= 80) return "High";
  if (efficiencyScore >= 60) return "Medium";
  return "Low";
};

const calculateTaskVelocity = (tasks) => {
  const completedTasks = tasks.filter((t) => t.status === "Completed");
  if (completedTasks.length === 0) return 0;

  // Simplified calculation - tasks per week
  return (completedTasks.length / 4).toFixed(1); // Assuming 4 weeks period
};

const calculateQualityScore = (tasks) => {
  // Simplified quality score based on completion rate and overdue tasks
  const completionRate =
    tasks.length > 0
      ? (tasks.filter((t) => t.status === "Completed").length / tasks.length) *
        100
      : 0;
  const overdueRate =
    tasks.length > 0
      ? (tasks.filter(
          (t) => t.status !== "Completed" && new Date(t.dueDate) < new Date()
        ).length /
          tasks.length) *
        100
      : 0;

  return Math.max(0, Math.round(completionRate - overdueRate * 0.5));
};

const getFocusAreas = (tasks) => {
  const overdueCount = tasks.filter(
    (t) => t.status !== "Completed" && new Date(t.dueDate) < new Date()
  ).length;

  if (overdueCount > tasks.length * 0.3) return "Timeliness";
  if (
    tasks.filter((t) => t.priority === "High" || t.priority === "Urgent")
      .length >
    tasks.length * 0.5
  )
    return "Priority Management";
  return "None";
};

// Task Performance Dashboard Component
const TaskPerformanceDashboard = ({ tasks, employee }) => {
  const [timeRange, setTimeRange] = useState("all");
  const [chartType, setChartType] = useState("completion");

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
              <BarChart3 className="w-4 h-4 text-purple-600" />
            </div>
            Task Performance
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No Performance Data
          </h3>
          <p className="text-slate-600">
            No tasks available to analyze performance.
          </p>
        </div>
      </div>
    );
  }

  // Filter tasks based on time range
  const filteredTasks = tasks.filter((task) => {
    if (timeRange === "all") return true;

    const taskDate = new Date(task.dueDate || task.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - taskDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (timeRange) {
      case "week":
        return diffDays <= 7;
      case "month":
        return diffDays <= 30;
      case "quarter":
        return diffDays <= 90;
      default:
        return true;
    }
  });

  // Calculate performance metrics
  const performanceMetrics = {
    totalTasks: filteredTasks.length,
    completedTasks: filteredTasks.filter((task) => task.status === "Completed")
      .length,
    inProgressTasks: filteredTasks.filter(
      (task) => task.status === "In Progress"
    ).length,
    pendingTasks: filteredTasks.filter((task) => task.status === "Pending")
      .length,
    overdueTasks: filteredTasks.filter((task) => {
      if (task.status === "Completed") return false;
      return new Date(task.dueDate) < new Date();
    }).length,
    completionRate:
      filteredTasks.length > 0
        ? (filteredTasks.filter((task) => task.status === "Completed").length /
            filteredTasks.length) *
          100
        : 0,
    averageCompletionTime: calculateAverageCompletionTime(filteredTasks),
    efficiencyScore: calculateEfficiencyScore(filteredTasks),
  };

  // Chart Data for Completion Rate
  const completionChartData = {
    labels: ["Completed", "In Progress", "Pending", "Overdue"],
    datasets: [
      {
        data: [
          performanceMetrics.completedTasks,
          performanceMetrics.inProgressTasks,
          performanceMetrics.pendingTasks,
          performanceMetrics.overdueTasks,
        ],
        backgroundColor: [
          "#10b981", // green
          "#f59e0b", // yellow
          "#3b82f6", // blue
          "#ef4444", // red
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  // Timeline Performance Data
  const timelineData = generateTimelineData(filteredTasks, timeRange);

  // Effort Distribution Data
  const effortData = {
    labels: ["Low", "Medium", "High", "Urgent"],
    datasets: [
      {
        label: "Tasks by Priority",
        data: [
          filteredTasks.filter((task) => task.priority === "Low").length,
          filteredTasks.filter((task) => task.priority === "Medium").length,
          filteredTasks.filter((task) => task.priority === "High").length,
          filteredTasks.filter((task) => task.priority === "Urgent").length,
        ],
        backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  // Category Distribution
  const categoryData = generateCategoryData(filteredTasks);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              Task Performance Dashboard
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Performance analytics for {employee?.personalDetails?.firstName}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Time Range Filter */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Chart Type Selector */}
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="completion">Completion Rate</option>
              <option value="timeline">Timeline</option>
              <option value="effort">Effort Analysis</option>
            </select>
          </div>
        </div>
      </div>

      {/* Performance Metrics Cards */}
      <div className="p-6 border-b border-slate-200">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Completion Rate"
            value={`${performanceMetrics.completionRate.toFixed(1)}%`}
            icon={CheckCircle2}
            trend={
              performanceMetrics.completionRate > 75
                ? "up"
                : performanceMetrics.completionRate > 50
                ? "neutral"
                : "down"
            }
            color="green"
          />
          <MetricCard
            title="Tasks Completed"
            value={performanceMetrics.completedTasks}
            icon={Award}
            subtitle={`of ${performanceMetrics.totalTasks}`}
            color="blue"
          />
          <MetricCard
            title="Efficiency Score"
            value={performanceMetrics.efficiencyScore}
            icon={Zap}
            trend="up"
            color="yellow"
          />
          <MetricCard
            title="Overdue Tasks"
            value={performanceMetrics.overdueTasks}
            icon={AlertTriangle}
            trend={performanceMetrics.overdueTasks > 0 ? "down" : "up"}
            color="red"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Main Chart */}
          <div className="bg-slate-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900">
                {chartType === "completion" && "Task Completion Distribution"}
                {chartType === "timeline" && "Performance Timeline"}
                {chartType === "effort" && "Effort Distribution"}
              </h3>
              <div className="flex items-center gap-1 text-slate-500">
                {chartType === "completion" && (
                  <PieChartIcon className="w-4 h-4" />
                )}
                {chartType === "timeline" && <LineChart className="w-4 h-4" />}
                {chartType === "effort" && <BarChart className="w-4 h-4" />}
              </div>
            </div>

            <div className="h-80">
              {chartType === "completion" && (
                <Doughnut
                  data={completionChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const total = context.dataset.data.reduce(
                              (a, b) => a + b,
                              0
                            );
                            const percentage = (
                              (context.parsed / total) *
                              100
                            ).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                          },
                        },
                      },
                    },
                  }}
                />
              )}

              {chartType === "timeline" && (
                <Line
                  data={timelineData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Number of Tasks",
                        },
                      },
                    },
                  }}
                />
              )}

              {chartType === "effort" && (
                <Bar
                  data={effortData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Number of Tasks",
                        },
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>

          {/* Side Charts */}
          <div className="space-y-6">
            {/* Category Distribution */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Tasks by Category
              </h4>
              <div className="h-64">
                <Bar
                  data={categoryData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    indexAxis: "y",
                    scales: {
                      x: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Performance Insights
              </h4>
              <div className="space-y-3">
                <InsightItem
                  title="Completion Trend"
                  value={getCompletionTrend(filteredTasks)}
                  type="trend"
                />
                <InsightItem
                  title="Average Completion Time"
                  value={performanceMetrics.averageCompletionTime}
                  type="time"
                />
                <InsightItem
                  title="On-time Delivery"
                  value={calculateOnTimeRate(filteredTasks)}
                  type="percentage"
                />
                <InsightItem
                  title="Productivity Level"
                  value={getProductivityLevel(
                    performanceMetrics.efficiencyScore
                  )}
                  type="level"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Task Velocity"
            value={calculateTaskVelocity(filteredTasks)}
            subtitle="tasks/week"
            icon={Zap}
          />
          <StatCard
            title="Quality Score"
            value={calculateQualityScore(filteredTasks)}
            subtitle="based on completion"
            icon={Award}
          />
          <StatCard
            title="Focus Areas"
            value={getFocusAreas(filteredTasks)}
            subtitle="needs improvement"
            icon={Target}
          />
        </div>
      </div>
    </div>
  );
};

// Effort Comparison Chart Component
const EffortComparisonChart = ({ task }) => {
  // Simplified effort comparison chart
  const data = {
    labels: ["Estimated", "Actual"],
    datasets: [
      {
        label: "Hours",
        data: [task.estimatedHours || 0, task.actualHours || 0],
        backgroundColor: ["#3b82f6", "#10b981"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="h-32">
      <Bar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
};

// Attendance Status Badge Component
const AttendanceStatusBadge = ({ status }) => {
  const statusConfig = {
    Present: {
      color: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle2,
    },
    Absent: {
      color: "bg-red-50 text-red-700 border-red-200",
      icon: AlertCircle,
    },
    "Half-day": {
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: Clock,
    },
    Leave: {
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: Calendar,
    },
    Holiday: {
      color: "bg-purple-50 text-purple-700 border-purple-200",
      icon: CalendarDays,
    },
    Weekend: {
      color: "bg-slate-50 text-slate-700 border-slate-200",
      icon: Calendar,
    },
  };

  const config = statusConfig[status] || statusConfig.Present;
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border ${config.color}`}
    >
      <IconComponent className="w-3 h-3" />
      {status}
    </span>
  );
};

// Attendance Statistics Component
const AttendanceStatistics = ({ attendance, period = "month" }) => {
  const stats = calculateAttendanceStats(attendance, period);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {stats.present}
          </div>
          <div className="text-sm text-green-600">Present</div>
          <div className="text-xs text-green-500 mt-1">
            {stats.presentRate}%
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
          <div className="text-sm text-red-600">Absent</div>
          <div className="text-xs text-red-500 mt-1">{stats.absentRate}%</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">
            {stats.halfDay}
          </div>
          <div className="text-sm text-yellow-600">Half Day</div>
          <div className="text-xs text-yellow-500 mt-1">
            {stats.halfDayRate}%
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">
            {stats.attendanceRate}%
          </div>
          <div className="text-sm text-blue-600">Overall Rate</div>
          <div
            className={`text-xs mt-1 ${
              stats.trend > 0
                ? "text-green-500"
                : stats.trend < 0
                ? "text-red-500"
                : "text-yellow-500"
            }`}
          >
            {stats.trend > 0 ? "↗" : stats.trend < 0 ? "↘" : "→"}{" "}
            {Math.abs(stats.trend)}%
          </div>
        </div>
      </div>
    </div>
  );
};

// Attendance Performance Chart Component
const AttendancePerformanceChart = ({ attendance, period }) => {
  const getChartData = () => {
    if (period === "week") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dayData = days.map((day) => {
        const dayAttendance = attendance.filter((record) => {
          const recordDay = new Date(record.date).getDay();
          return recordDay === days.indexOf(day) + 1;
        });
        const presentCount = dayAttendance.filter(
          (a) => a.status === "Present"
        ).length;
        return presentCount;
      });

      return {
        labels: days,
        datasets: [
          {
            label: "Present Days",
            data: dayData,
            backgroundColor: "#10b981",
            borderColor: "#10b981",
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
      };
    } else {
      // Monthly data - group by weeks
      const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
      const weekData = weeks.map((_, index) => {
        const weekAttendance = attendance.filter((record) => {
          const recordDate = new Date(record.date);
          const weekOfMonth = Math.ceil(recordDate.getDate() / 7) - 1;
          return weekOfMonth === index;
        });
        const presentRate =
          weekAttendance.length > 0
            ? (weekAttendance.filter((a) => a.status === "Present").length /
                weekAttendance.length) *
              100
            : 0;
        return presentRate;
      });

      return {
        labels: weeks,
        datasets: [
          {
            label: "Attendance Rate (%)",
            data: weekData,
            backgroundColor: "#3b82f6",
            borderColor: "#3b82f6",
            borderWidth: 2,
            fill: false,
            tension: 0.4,
          },
        ],
      };
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            if (period === "week") {
              return `Present: ${context.parsed.y} days`;
            } else {
              return `Attendance: ${context.parsed.y.toFixed(1)}%`;
            }
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: period === "week" ? 7 : 100,
        title: {
          display: true,
          text: period === "week" ? "Days Present" : "Attendance Rate (%)",
        },
      },
      x: {
        title: {
          display: true,
          text: period === "week" ? "Days of Week" : "Weeks of Month",
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={getChartData()} options={chartOptions} />
    </div>
  );
};

// Attendance Stats Cards Component
const AttendanceStatsCards = ({ attendance, period }) => {
  const stats = calculateAttendanceStats(attendance, period);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-green-700">{stats.present}</div>
        <div className="text-sm text-green-600">Present</div>
        <div className="text-xs text-green-500 mt-1">{stats.presentRate}%</div>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
        <div className="text-sm text-red-600">Absent</div>
        <div className="text-xs text-red-500 mt-1">{stats.absentRate}%</div>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-yellow-700">
          {stats.halfDay}
        </div>
        <div className="text-sm text-yellow-600">Half Day</div>
        <div className="text-xs text-yellow-500 mt-1">{stats.halfDayRate}%</div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-700">
          {stats.attendanceRate}%
        </div>
        <div className="text-sm text-blue-600">Overall Rate</div>
        <div className="text-xs text-blue-500 mt-1">
          {stats.trend > 0 ? "↗" : stats.trend < 0 ? "↘" : "→"}{" "}
          {Math.abs(stats.trend)}%
        </div>
      </div>
    </div>
  );
};

// Attendance Distribution Chart Component
const AttendanceDistributionChart = ({ attendance }) => {
  const statusCount = attendance.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {});

  const data = {
    labels: Object.keys(statusCount),
    datasets: [
      {
        data: Object.values(statusCount),
        backgroundColor: [
          "#10b981", // Present - green
          "#ef4444", // Absent - red
          "#f59e0b", // Half-day - yellow
          "#3b82f6", // Leave - blue
          "#8b5cf6", // Holiday - purple
          "#6b7280", // Weekend - gray
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  );
};

// Overtime Analysis Component
const OvertimeAnalysis = ({ attendance }) => {
  const overtimeRecords = attendance.filter(
    (record) => record.overtimeHours > 0
  );
  const totalOvertime = overtimeRecords.reduce(
    (sum, record) => sum + record.overtimeHours,
    0
  );
  const avgOvertime =
    overtimeRecords.length > 0 ? totalOvertime / overtimeRecords.length : 0;

  const weeklyOvertime = [45, 52, 38, 42].map((hours) => hours - 40); // Example data

  const data = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Overtime Hours",
        data: weeklyOvertime,
        backgroundColor: weeklyOvertime.map((hours) =>
          hours > 0 ? "#f59e0b" : "#10b981"
        ),
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Overtime Hours",
        },
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-orange-700">
            {totalOvertime.toFixed(1)}
          </div>
          <div className="text-sm text-orange-600">Total OT Hours</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-purple-700">
            {avgOvertime.toFixed(1)}
          </div>
          <div className="text-sm text-purple-600">Avg OT/Day</div>
        </div>
      </div>
      <div className="h-48">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

// Helper function to calculate attendance statistics
const calculateAttendanceStats = (attendance, period) => {
  const total = attendance.length;
  const present = attendance.filter((a) => a.status === "Present").length;
  const absent = attendance.filter((a) => a.status === "Absent").length;
  const halfDay = attendance.filter((a) => a.status === "Half-day").length;
  const leave = attendance.filter((a) => a.status === "Leave").length;

  const presentRate = total > 0 ? Math.round((present / total) * 100) : 0;
  const absentRate = total > 0 ? Math.round((absent / total) * 100) : 0;
  const halfDayRate = total > 0 ? Math.round((halfDay / total) * 100) : 0;

  // Simple trend calculation (in real app, compare with previous period)
  const trend = presentRate > 85 ? 2 : presentRate > 70 ? 0 : -2;

  return {
    total,
    present,
    absent,
    halfDay,
    leave,
    presentRate,
    absentRate,
    halfDayRate,
    attendanceRate: presentRate,
    trend,
  };
};

// Main EmployeeDetail Component
export default function EmployeeDetail({ employeeId }) {
  const router = useRouter(); // Moved inside the component
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [payslips, setPayslips] = useState([]);
  const [taxCalculations, setTaxCalculations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [attendanceSubTab, setAttendanceSubTab] = useState("weekly");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)), // Default to last 7 days
    end: new Date(),
  });
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });

  useEffect(() => {
    if (employeeId) {
      fetchEmployee();
    }
  }, [employeeId]);

  useEffect(() => {
    if (employee && activeTab === "payslips") {
      fetchPayslips();
    }
  }, [employee, activeTab]);

  useEffect(() => {
    if (employee && activeTab === "taxes") {
      fetchTaxCalculations();
    }
  }, [employee, activeTab]);

  // Fetch tasks whenever employee data is loaded
  useEffect(() => {
    if (employee) {
      fetchTasks();
    }
  }, [employee]);

  // Fetch attendance records when attendance tab is active
  useEffect(() => {
    if (employee && activeTab === "attendance") {
      fetchAttendance();
    }
  }, [employee, activeTab]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payroll/employees/${employeeId}`);
      if (response.ok) {
        const employeeData = await response.json();
        setEmployee(employeeData);
      } else {
        console.error("Failed to fetch employee:", await response.json());
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayslips = async () => {
    try {
      const response = await fetch(
        `/api/payroll/payslip?employeeId=${employeeId}`
      );

      if (response.ok) {
        const data = await response.json();
        setPayslips(data.payslips || []);
      }
    } catch (error) {
      console.error("Error fetching payslips:", error);
    }
  };

  const fetchTaxCalculations = async () => {
    try {
      const response = await fetch(
        `/api/payroll/taxes?employeeId=${employeeId}`
      );

      if (response.ok) {
        const data = await response.json();
        setTaxCalculations(data.taxCalculations || []);
      }
    } catch (error) {
      console.error("Error fetching tax calculations:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      // Fetch all tasks and filter on frontend to only show tasks assigned to this employee
      const response = await fetch(`/api/tasks?includeDetails=true`);

      if (response.ok) {
        const data = await response.json();
        // Filter tasks to only show those assigned to the current employee
        const employeeTasks = data.data.filter(
          (task) => task.assignedTo && task.assignedTo._id === employeeId
        );
        setTasks(employeeTasks);
      } else {
        console.error("Failed to fetch tasks:", await response.json());
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Update the fetchAttendance function to handle different date ranges
  const fetchAttendance = async (
    period = "weekly",
    customStart = null,
    customEnd = null
  ) => {
    try {
      setAttendanceLoading(true);
      let url = `/api/payroll/attendance?employeeId=${employeeId}`;

      let startDate, endDate;

      switch (period) {
        case "weekly":
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          endDate = new Date();
          break;
        case "monthly":
          startDate = new Date();
          startDate.setDate(1); // First day of current month
          endDate = new Date();
          break;
        case "custom":
          startDate = customStart || customDateRange.start;
          endDate = customEnd || customDateRange.end;
          break;
        default:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          endDate = new Date();
      }

      // Ensure dates are properly formatted
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      url += `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance || []);
      } else {
        console.error("Failed to fetch attendance:", await response.json());
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Update the useEffect for attendance to use the new function
  useEffect(() => {
    if (employee && activeTab === "attendance") {
      fetchAttendance(attendanceSubTab);
    }
  }, [employee, activeTab, attendanceSubTab]);

  // Add this function to handle custom date range changes
  const handleCustomDateRangeChange = (type, value) => {
    setCustomDateRange((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  // Add this function to apply custom date range
  const applyCustomDateRange = () => {
    fetchAttendance("custom", customDateRange.start, customDateRange.end);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this employee? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/payroll/employees/${employeeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        window.location.href = "/payroll/employees";
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("An error occurred while deleting the employee");
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      Active: "bg-green-50 text-green-700 border-green-200",
      Inactive: "bg-slate-50 text-slate-700 border-slate-200",
      Suspended: "bg-yellow-50 text-yellow-700 border-yellow-200",
      Terminated: "bg-red-50 text-red-700 border-red-200",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${
          statusStyles[status] || "bg-slate-50 text-slate-700 border-slate-200"
        }`}
      >
        {status}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return "N/A";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  const calculateTenure = (joinDate) => {
    if (!joinDate) return "N/A";
    const today = new Date();
    const join = new Date(joinDate);
    const years = today.getFullYear() - join.getFullYear();
    const months = today.getMonth() - join.getMonth();

    let tenure = "";
    if (years > 0) tenure += `${years} year${years > 1 ? "s" : ""} `;
    if (months > 0 || years === 0)
      tenure += `${months} month${months !== 1 ? "s" : ""}`;

    return tenure.trim() || "0 months";
  };

  // Enhanced task status badge with icons
  const getTaskStatusBadge = (status) => {
    const statusConfig = {
      Pending: {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Clock,
        dotColor: "bg-blue-500",
      },
      "In Progress": {
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: PlayCircle,
        dotColor: "bg-yellow-500",
      },
      Completed: {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: CheckCircle2,
        dotColor: "bg-green-500",
      },
      Blocked: {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: AlertTriangle,
        dotColor: "bg-red-500",
      },
      Deferred: {
        color: "bg-slate-50 text-slate-700 border-slate-200",
        icon: PauseCircle,
        dotColor: "bg-slate-500",
      },
    };

    const config = statusConfig[status] || statusConfig["Pending"];
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border ${config.color}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
        <IconComponent className="w-3 h-3" />
        {status}
      </span>
    );
  };

  // Enhanced priority badge
  const getPriorityBadge = (priority) => {
    const priorityStyles = {
      Low: "bg-green-50 text-green-700 border-green-200",
      Medium: "bg-blue-50 text-blue-700 border-blue-200",
      High: "bg-yellow-50 text-yellow-700 border-yellow-200",
      Urgent: "bg-red-50 text-red-700 border-red-200",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${
          priorityStyles[priority] ||
          "bg-slate-50 text-slate-700 border-slate-200"
        }`}
      >
        {priority}
      </span>
    );
  };

  // Calculate task progress based on subtasks
  const calculateTaskProgress = (task) => {
    if (task.subTasks && task.subTasks.length > 0) {
      const completed = task.subTasks.filter((st) => st.completed).length;
      return (completed / task.subTasks.length) * 100;
    }
    return task.status === "Completed"
      ? 100
      : task.status === "In Progress"
      ? 50
      : 0;
  };

  // Task Progress Bar Component for Overview
  const TaskProgressBar = ({ tasks }) => {
    const statusCount = tasks?.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    const statusColors = {
      Completed: "bg-green-500",
      "In Progress": "bg-yellow-500",
      Pending: "bg-blue-500",
      Blocked: "bg-red-500",
      Deferred: "bg-slate-500",
    };

    const statusOrder = [
      "Completed",
      "In Progress",
      "Pending",
      "Blocked",
      "Deferred",
    ];

    return (
      <div className="mt-4">
        <div className="flex h-3 bg-slate-200 rounded-full overflow-hidden">
          {statusOrder.map((status) => {
            const count = statusCount[status] || 0;
            const percentage =
              tasks?.length > 0 ? (count / tasks?.length) * 100 : 0;

            if (count === 0) return null;

            return (
              <div
                key={status}
                className={`${statusColors[status]} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
                title={`${status}: ${count} tasks (${percentage.toFixed(1)}%)`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>Total: {tasks?.length} tasks</span>
          <span>
            {tasks?.length > 0
              ? (
                  (tasks?.filter((t) => t.status === "Completed").length /
                    tasks?.length) *
                  100
                ).toFixed(0)
              : 0}
            % Overall Completion
          </span>
        </div>
      </div>
    );
  };

  // Task Detail Modal
  const TaskDetailModal = ({ task, onClose }) => {
    if (!task) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">
                {task.title}
              </h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-slate-600 mt-2">{task.description}</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900">Task Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status:</span>
                    {getTaskStatusBadge(task.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Priority:</span>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Category:</span>
                    <span className="font-medium">
                      {task.category || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Due Date:</span>
                    <span className="font-medium">
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900">
                  Effort Tracking
                </h4>
                <EffortComparisonChart task={task} />
              </div>
            </div>

            {/* Task Performance Dashboard */}
            <div className="mt-6">
              <TaskPerformanceDashboard tasks={[task]} employee={employee} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          <span className="text-slate-600 font-medium">
            Loading employee details...
          </span>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Employee Not Found
          </h2>
          <p className="text-slate-600 mb-6">
            The requested employee could not be found.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
          </button>
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
            <div className="flex items-start gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    {employee.personalDetails?.firstName}{" "}
                    {employee.personalDetails?.lastName}
                  </h1>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-slate-600 font-medium">
                      {employee.employeeId}
                    </span>
                    {getStatusBadge(employee.status)}
                  </div>
                  <p className="text-slate-600">
                    {employee.jobDetails?.designation} •{" "}
                    {employee.jobDetails?.department}
                  </p>

                  {/* Task Quick Stats in Header */}
                  {tasks?.length > 0 && (
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-slate-600">
                          {
                            tasks?.filter((t) => t.status === "Completed")
                              .length
                          }{" "}
                          Completed
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-slate-600">
                          {
                            tasks?.filter((t) => t.status === "In Progress")
                              .length
                          }{" "}
                          In Progress
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-slate-600">
                          {tasks?.filter((t) => t.status === "Pending").length}{" "}
                          Pending
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href={`/payroll/employees/${employeeId}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
          <div className="border-b border-slate-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: "overview", label: "Overview", icon: User },
                { id: "payslips", label: "Payslips", icon: FileText },
                { id: "taxes", label: "Tax Records", icon: Calculator },
                { id: "tasks", label: "Tasks", icon: Target },
                { id: "documents", label: "Documents", icon: FileText },
                { id: "attendance", label: "Attendance", icon: UserCheck },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
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

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Personal & Job Information */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    Personal Information
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="text-sm text-slate-600">Email</div>
                          <div className="font-medium text-slate-900">
                            {employee.personalDetails?.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="text-sm text-slate-600">Phone</div>
                          <div className="font-medium text-slate-900">
                            {employee.personalDetails?.phone}
                          </div>
                        </div>
                      </div>

                      {employee.personalDetails?.gender && (
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-slate-400" />
                          <div>
                            <div className="text-sm text-slate-600">Gender</div>
                            <div className="font-medium text-slate-900">
                              {employee.personalDetails.gender}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {employee.personalDetails?.dateOfBirth && (
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-slate-400" />
                          <div>
                            <div className="text-sm text-slate-600">
                              Date of Birth
                            </div>
                            <div className="font-medium text-slate-900">
                              {formatDate(employee.personalDetails.dateOfBirth)}
                              <span className="text-slate-500 ml-2">
                                (
                                {calculateAge(
                                  employee.personalDetails.dateOfBirth
                                )}{" "}
                                years)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="text-sm text-slate-600">
                            Date of Joining
                          </div>
                          <div className="font-medium text-slate-900">
                            {formatDate(
                              employee.personalDetails?.dateOfJoining
                            )}
                            <span className="text-slate-500 ml-2">
                              (
                              {calculateTenure(
                                employee.personalDetails?.dateOfJoining
                              )}
                              )
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {employee.personalDetails?.address && (
                    <div className="flex items-start gap-3 pt-4 border-t border-slate-200">
                      <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-slate-600">Address</div>
                        <div className="font-medium text-slate-900">
                          {employee.personalDetails.address.street &&
                            `${employee.personalDetails.address.street}, `}
                          {employee.personalDetails.address.city &&
                            `${employee.personalDetails.address.city}, `}
                          {employee.personalDetails.address.state &&
                            `${employee.personalDetails.address.state} - `}
                          {employee.personalDetails.address.zipCode}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Information - Fixed Section */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                      <Briefcase className="w-4 h-4 text-green-600" />
                    </div>
                    Job Information
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-slate-600">Department</div>
                        <div className="font-medium text-slate-900">
                          {employee.jobDetails?.department}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-slate-600">Designation</div>
                        <div className="font-medium text-slate-900">
                          {employee.jobDetails?.designation}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-slate-600">Employment Type</div>
                        <div className="font-medium text-slate-900">
                          {employee.jobDetails?.employmentType}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-slate-600">Work Location</div>
                        <div className="font-medium text-slate-900">
                          {employee.jobDetails?.workLocation || "Not specified"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Status Overview - VISIBLE IN OVERVIEW TAB */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                  Task Status Overview
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Current task distribution for{" "}
                  {employee.personalDetails?.firstName}
                </p>
              </div>

              <div className="p-6">
                {tasks?.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No Tasks Assigned
                    </h3>
                    <p className="text-slate-600 mb-4">
                      This employee has no tasks assigned yet.
                    </p>
                    <button
                      onClick={() => router.push("/tasks/create")}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Assign First Task
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Task Statistics */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-900">
                        Task Distribution
                      </h4>
                      <TaskProgressBar tasks={tasks} />
                      <div className="space-y-3">
                        {(() => {
                          const statusCount = tasks?.reduce((acc, task) => {
                            acc[task.status] = (acc[task.status] || 0) + 1;
                            return acc;
                          }, {});

                          const statusOrder = [
                            "Completed",
                            "In Progress",
                            "Pending",
                            "Blocked",
                            "Deferred",
                          ];

                          return statusOrder
                            .map((status) => {
                              const count = statusCount[status] || 0;
                              const percentage =
                                tasks?.length > 0
                                  ? (count / tasks?.length) * 100
                                  : 0;

                              if (count === 0) return null;

                              return (
                                <div
                                  key={status}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3">
                                    {getTaskStatusBadge(status)}
                                    <span className="text-sm text-slate-600">
                                      {count} tasks
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium text-slate-900">
                                    {percentage.toFixed(0)}%
                                  </span>
                                </div>
                              );
                            })
                            .filter(Boolean);
                        })()}
                      </div>

                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-700">
                            {
                              tasks?.filter((t) => t.status === "Completed")
                                .length
                            }
                          </div>
                          <div className="text-sm text-green-600">
                            Completed
                          </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-700">
                            {
                              tasks?.filter(
                                (t) =>
                                  t.status === "In Progress" ||
                                  t.status === "Pending"
                              ).length
                            }
                          </div>
                          <div className="text-sm text-blue-600">Active</div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Tasks */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-900">
                          Recent Tasks
                        </h4>
                        <button
                          onClick={() => setActiveTab("tasks")}
                          className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                        >
                          View All Tasks →
                        </button>
                      </div>
                      <div className="space-y-3">
                        {tasks?.slice(0, 3).map((task) => (
                          <div
                            key={task._id}
                            className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedTask(task)}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  task.status === "Completed"
                                    ? "bg-green-500"
                                    : task.status === "In Progress"
                                    ? "bg-yellow-500"
                                    : task.status === "Blocked"
                                    ? "bg-red-500"
                                    : "bg-blue-500"
                                }`}
                              />
                              <div>
                                <div className="font-medium text-slate-900 text-sm">
                                  {task.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {getPriorityBadge(task.priority)}
                                  <span className="text-xs text-slate-500">
                                    Due: {formatDate(task.dueDate)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-slate-500">
                                {task.estimatedHours
                                  ? `${task.estimatedHours}h`
                                  : "No est."}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Dashboard */}
            <TaskPerformanceDashboard tasks={tasks} employee={employee} />

            {/* Salary Information */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                    <CreditCard className="w-4 h-4 text-yellow-600" />
                  </div>
                  Salary & Financial Information
                </h2>
              </div>
              <div className="p-6">
                {employee.salaryDetails && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic Salary */}
                    <div className="text-center p-6 bg-slate-50 rounded-xl">
                      <div className="text-sm text-slate-600 mb-2">
                        Basic Salary
                      </div>
                      <div className="text-2xl font-bold text-slate-900">
                        {formatCurrency(employee.salaryDetails.basicSalary)}
                      </div>
                    </div>

                    {/* Allowances */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-900">
                        Allowances
                      </h4>
                      {employee.salaryDetails.allowances &&
                      employee.salaryDetails.allowances.length > 0 ? (
                        <div className="space-y-2">
                          {employee.salaryDetails.allowances.map(
                            (allowance, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg"
                              >
                                <span className="text-sm text-slate-700">
                                  {allowance.type}
                                </span>
                                <span className="font-medium text-green-700">
                                  {formatCurrency(allowance.amount)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          No allowances configured
                        </p>
                      )}
                    </div>

                    {/* Deductions */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-900">
                        Deductions
                      </h4>
                      {employee.salaryDetails.deductions &&
                      employee.salaryDetails.deductions.length > 0 ? (
                        <div className="space-y-2">
                          {employee.salaryDetails.deductions.map(
                            (deduction, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg"
                              >
                                <span className="text-sm text-slate-700">
                                  {deduction.type}
                                </span>
                                <span className="font-medium text-red-700">
                                  -{formatCurrency(deduction.amount)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          No deductions configured
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Bank & Tax Details */}
                {employee.salaryDetails && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 pt-6 border-t border-slate-200">
                    {/* Bank Account */}
                    {employee.salaryDetails.bankAccount && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                          Bank Account
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-slate-600">Bank: </span>
                            <span className="font-medium">
                              {employee.salaryDetails.bankAccount.bankName}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600">Account: </span>
                            <span className="font-medium">
                              XXXX-XXXX-XXXX-
                              {employee.salaryDetails.bankAccount.accountNumber?.slice(
                                -4
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600">IFSC: </span>
                            <span className="font-medium">
                              {employee.salaryDetails.bankAccount.ifscCode}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tax Information */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                        <IdCard className="w-4 h-4" />
                        Tax Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        {employee.salaryDetails.panNumber && (
                          <div>
                            <span className="text-slate-600">PAN: </span>
                            <span className="font-medium">
                              {employee.salaryDetails.panNumber}
                            </span>
                          </div>
                        )}
                        {employee.salaryDetails.aadharNumber && (
                          <div>
                            <span className="text-slate-600">Aadhar: </span>
                            <span className="font-medium">
                              XXXX-XXXX-
                              {employee.salaryDetails.aadharNumber.slice(-4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                      <Target className="w-4 h-4 text-purple-600" />
                    </div>
                    Assigned Tasks
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    View and manage tasks assigned to{" "}
                    {employee?.personalDetails?.firstName}
                  </p>
                </div>
                <button
                  onClick={() => router.push("/tasks/create")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Assign Task
                </button>
              </div>
            </div>
            <div className="p-6">
              {tasks?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No Tasks Assigned
                  </h3>
                  <p className="text-slate-600 mb-6">
                    This employee has no tasks assigned yet.
                  </p>
                  <Link
                    href={"/tasks/create"}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Assign Task
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {tasks?.map((task) => (
                    <div
                      key={task._id}
                      className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <h4
                                className="font-semibold text-slate-900 text-lg cursor-pointer hover:text-yellow-600 transition-colors"
                                onClick={() => setSelectedTask(task)}
                              >
                                {task.title}
                              </h4>
                              <p className="text-sm text-slate-600 mt-1">
                                {task.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                {getTaskStatusBadge(task.status)}
                                {getPriorityBadge(task.priority)}
                                <span className="flex items-center gap-1 text-sm text-slate-600">
                                  <CalendarIcon className="w-3 h-3" />
                                  Due: {formatDate(task.dueDate)}
                                </span>
                                {task.category && (
                                  <span className="flex items-center gap-1 text-sm text-slate-600">
                                    <FolderOpen className="w-3 h-3" />
                                    {task.category}
                                  </span>
                                )}
                                {task.estimatedHours && (
                                  <span className="flex items-center gap-1 text-sm text-slate-600">
                                    <ClockIcon className="w-3 h-3" />
                                    {task.estimatedHours}h
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Additional Task Info */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
                        <div className="flex items-center gap-4">
                          {task.comments && task.comments.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {task.comments.length} comments
                            </span>
                          )}
                          {task.attachments && task.attachments.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {task.attachments.length} files
                            </span>
                          )}
                          {task.subTasks && task.subTasks.length > 0 && (
                            <span className="flex items-center gap-1">
                              <CheckSquare className="w-3 h-3" />
                              {
                                task.subTasks.filter((st) => st.completed)
                                  .length
                              }
                              /{task.subTasks.length} subtasks
                            </span>
                          )}
                        </div>
                        <span>Created: {formatDate(task.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Task Detail Modal */}
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
          />
        )}

        {/* Payslips Tab */}
        {activeTab === "payslips" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  Payslip History
                </h2>
                <button
                  onClick={() => router.push(`/payroll/payslip/generate`)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Generate Payslip
                </button>
              </div>
            </div>
            <div className="p-6">
              {payslips.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No Payslips Found
                  </h3>
                  <p className="text-slate-600 mb-6">
                    No payslips have been generated for this employee yet.
                  </p>
                  <button
                    onClick={() => router.push(`/payroll/payslip/generate`)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Generate First Payslip
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {payslips.map((payslip) => (
                    <div
                      key={payslip._id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Receipt className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {payslip.payslipId}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {new Date(
                              payslip.year,
                              payslip.month - 1
                            ).toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-lg text-slate-900">
                            {formatCurrency(payslip.netSalary)}
                          </p>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${
                              payslip.status === "Paid"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : payslip.status === "Generated"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {payslip.status}
                          </span>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Taxes Tab */}
        {activeTab === "taxes" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                    <Calculator className="w-4 h-4 text-green-600" />
                  </div>
                  Tax Calculations
                </h2>
                <button
                  onClick={() =>
                    router.push(
                      `/payroll/taxes/calculate?employeeId=${employeeId}`
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Calculate Tax
                </button>
              </div>
            </div>
            <div className="p-6">
              {taxCalculations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calculator className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No Tax Calculations
                  </h3>
                  <p className="text-slate-600 mb-6">
                    No tax calculations have been performed for this employee
                    yet.
                  </p>
                  <button
                    onClick={() =>
                      router.push(
                        `/payroll/taxes/calculate?employeeId=${employeeId}`
                      )
                    }
                    className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Calculate Tax
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {taxCalculations.map((tax) => (
                    <div
                      key={tax._id}
                      className="p-6 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {tax.financialYear}
                          </h4>
                          <p className="text-sm text-slate-600">
                            Financial Year Tax Calculation
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${
                            tax.status === "Filed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : tax.status === "Approved"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {tax.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-sm text-slate-600 mb-1">
                            Taxable Income
                          </div>
                          <div className="font-semibold text-lg text-slate-900">
                            {formatCurrency(tax.taxableIncome)}
                          </div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="text-sm text-slate-600 mb-1">
                            Total Tax
                          </div>
                          <div className="font-semibold text-lg text-red-700">
                            {formatCurrency(tax.totalTax)}
                          </div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-sm text-slate-600 mb-1">
                            Effective Rate
                          </div>
                          <div className="font-semibold text-lg text-yellow-700">
                            {tax.taxableIncome > 0
                              ? (
                                  (tax.totalTax / tax.taxableIncome) *
                                  100
                                ).toFixed(2)
                              : 0}
                            %
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                Employee Documents
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Manage and view employee documents and records
              </p>
            </div>

            <div className="p-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No Documents
                </h3>
                <p className="text-slate-600 mb-6">
                  No documents have been uploaded for this employee yet.
                </p>
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors">
                  <Plus className="w-4 h-4" />
                  Upload Document
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                  </div>
                  Employee Attendance
                </h2>
                <button
                  onClick={() => router.push("/payroll/attendance/mark")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Mark Attendance
                </button>
              </div>
              <p className="text-slate-600 text-sm mt-1">
                View and manage attendance records for{" "}
                {employee.personalDetails?.firstName}
              </p>
            </div>

            <div className="p-6">
              {/* Attendance Sub Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "weekly", label: "Weekly View", icon: CalendarDays },
                    { id: "monthly", label: "Monthly View", icon: Calendar },
                    { id: "custom", label: "Custom Range", icon: CalendarIcon },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setAttendanceSubTab(tab.id);
                        if (tab.id !== "custom") {
                          fetchAttendance(tab.id);
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        attendanceSubTab === tab.id
                          ? "bg-yellow-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Date Range Display */}
                <div className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                  {attendanceSubTab === "weekly" && "Last 7 days"}
                  {attendanceSubTab === "monthly" && "This month"}
                  {attendanceSubTab === "custom" &&
                    `${customDateRange.start.toLocaleDateString()} - ${customDateRange.end.toLocaleDateString()}`}
                </div>
              </div>

              {/* Custom Date Range Selector */}
              {attendanceSubTab === "custom" && (
                <div className="bg-slate-50 rounded-xl p-6 mb-6">
                  <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Select Date Range
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={
                          customDateRange.start.toISOString().split("T")[0]
                        }
                        onChange={(e) =>
                          handleCustomDateRangeChange(
                            "start",
                            new Date(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={customDateRange.end.toISOString().split("T")[0]}
                        onChange={(e) =>
                          handleCustomDateRangeChange(
                            "end",
                            new Date(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={applyCustomDateRange}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Apply Date Range
                  </button>
                </div>
              )}

              {attendanceLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                    <span className="text-slate-600 font-medium">
                      Loading attendance records...
                    </span>
                  </div>
                </div>
              ) : attendance.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No Attendance Records
                  </h3>
                  <p className="text-slate-600 mb-6">
                    No attendance records found for the selected period.
                  </p>
                  <button
                    onClick={() => router.push("/payroll/attendance/mark")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Mark Attendance
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-700">
                        {
                          attendance.filter((a) => a.status === "Present")
                            .length
                        }
                      </div>
                      <div className="text-sm text-green-600">Present</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-700">
                        {attendance.filter((a) => a.status === "Absent").length}
                      </div>
                      <div className="text-sm text-red-600">Absent</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-700">
                        {
                          attendance.filter((a) => a.status === "Half-day")
                            .length
                        }
                      </div>
                      <div className="text-sm text-yellow-600">Half Day</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-700">
                        {Math.round(
                          (attendance.filter((a) => a.status === "Present")
                            .length /
                            attendance.length) *
                            100
                        )}
                        %
                      </div>
                      <div className="text-sm text-blue-600">
                        Attendance Rate
                      </div>
                    </div>
                  </div>

                  {/* Performance Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Attendance Performance Chart */}
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Attendance Trend
                      </h4>
                      <AttendancePerformanceChart
                        attendance={attendance}
                        period={attendanceSubTab}
                      />
                    </div>

                    {/* Attendance Distribution */}
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <PieChart className="w-4 h-4" />
                        Status Distribution
                      </h4>
                      <AttendanceDistributionChart attendance={attendance} />
                    </div>
                  </div>

                  {/* Overtime Analysis */}
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Overtime Analysis
                    </h4>
                    <OvertimeAnalysis attendance={attendance} />
                  </div>

                  {/* Detailed Records */}
                  <div className="bg-slate-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-900">
                        Detailed Records ({attendance.length} records)
                      </h4>
                      <div className="text-sm text-slate-600">
                        {attendanceSubTab === "weekly" && "Last 7 days"}
                        {attendanceSubTab === "monthly" && "This month"}
                        {attendanceSubTab === "custom" &&
                          `${customDateRange.start.toLocaleDateString()} - ${customDateRange.end.toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {attendance.map((record) => (
                        <div
                          key={record._id}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-white transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-slate-900">
                                {formatDate(record.date)}
                              </h5>
                              <div className="flex items-center gap-3 mt-1">
                                <AttendanceStatusBadge status={record.status} />
                                {record.checkIn && (
                                  <span className="text-sm text-slate-600">
                                    Check-in: {formatTime(record.checkIn)}
                                  </span>
                                )}
                                {record.checkOut && (
                                  <span className="text-sm text-slate-600">
                                    Check-out: {formatTime(record.checkOut)}
                                  </span>
                                )}
                                {record.totalHours > 0 && (
                                  <span className="text-sm text-slate-600">
                                    Hours: {record.totalHours.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            {record.isProxy && (
                              <div className="text-xs text-slate-500 mb-2">
                                Proxy Marked
                              </div>
                            )}
                            {record.overtimeHours > 0 && (
                              <div className="text-sm font-medium text-green-600">
                                +{record.overtimeHours} OT hours
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
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