import Link from 'next/link';
import { 
  Users, CheckSquare, CreditCard, BarChart3, TrendingUp,
  Truck, Package, AlertTriangle, Clock, Target, Zap,
  Factory, Warehouse, ShoppingCart, DollarSign, Globe,
  Activity, Bell, Calendar, FileText, ArrowUp, ArrowDown,
  MapPin, Shield, ChevronRight, Plus, RefreshCw, Settings,
  PieChart, LineChart, Building2, Container, Timer,
  Boxes, CheckCircle2, AlertCircle, Star, Award
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total Employees',
      value: '247',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      href: '/payroll/employees'
    },
    {
      title: 'Active Shipments',
      value: '89',
      change: '+8%',
      trend: 'up',
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      href: '/'
    },
    {
      title: 'Pending Orders',
      value: '156',
      change: '-5%',
      trend: 'down',
      icon: ShoppingCart,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      href: '/'
    },
    {
      title: 'Inventory Value',
      value: '$2.4M',
      change: '+15%',
      trend: 'up',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      href: '/'
    },
    {
      title: 'Active Suppliers',
      value: '34',
      change: '+2',
      trend: 'up',
      icon: Factory,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      href: '/'
    },
    {
      title: 'Warehouse Capacity',
      value: '78%',
      change: '+3%',
      trend: 'up',
      icon: Warehouse,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      href: '/'
    },
    {
      title: 'Monthly Revenue',
      value: '$1.8M',
      change: '+22%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      href: '/'
    },
    {
      title: 'Active Tasks',
      value: '43',
      change: '-8',
      trend: 'down',
      icon: CheckSquare,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      href: '/'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'shipment',
      title: 'Shipment #SC-2024-0892 delivered',
      description: 'Electronics shipment delivered to Amazon Warehouse NYC',
      time: '2 minutes ago',
      status: 'success',
      icon: CheckCircle2,
      color: 'text-green-600'
    },
    {
      id: 2,
      type: 'alert',
      title: 'Low inventory alert',
      description: 'Widget A-123 stock level below threshold (12 units remaining)',
      time: '15 minutes ago',
      status: 'warning',
      icon: AlertTriangle,
      color: 'text-yellow-600'
    },
    {
      id: 3,
      type: 'order',
      title: 'New bulk order received',
      description: 'TechCorp placed order for 500 units of Product SKU-456',
      time: '32 minutes ago',
      status: 'info',
      icon: ShoppingCart,
      color: 'text-blue-600'
    },
    {
      id: 4,
      type: 'supplier',
      title: 'Supplier onboarded',
      description: 'GlobalTech Industries approved as Tier-1 supplier',
      time: '1 hour ago',
      status: 'success',
      icon: Factory,
      color: 'text-green-600'
    },
    {
      id: 5,
      type: 'delay',
      title: 'Shipment delay notification',
      description: 'Shipment #SC-2024-0889 delayed due to weather conditions',
      time: '2 hours ago',
      status: 'error',
      icon: Clock,
      color: 'text-red-600'
    }
  ];

  const quickActions = [
    {
      title: 'Create Purchase Order',
      description: 'Generate new purchase order for suppliers',
      icon: FileText,
      href: '/',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      title: 'Track Shipment',
      description: 'Monitor real-time shipment status and location',
      icon: MapPin,
      href: '/',
      color: 'bg-green-50 hover:bg-green-100 border-green-200'
    },
    {
      title: 'Add New Supplier',
      description: 'Register and onboard new supplier',
      icon: Factory,
      href: '/',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    },
    {
      title: 'Inventory Audit',
      description: 'Perform stock count and reconciliation',
      icon: Package,
      href: '/',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200'
    },
    {
      title: 'Generate Report',
      description: 'Create operational and financial reports',
      icon: BarChart3,
      href: '/',
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
    },
    {
      title: 'Schedule Delivery',
      description: 'Plan and coordinate delivery routes',
      icon: Truck,
      href: '/',
      color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
    }
  ];

  const criticalAlerts = [
    {
      title: 'Inventory Shortage',
      message: '3 products below safety stock levels',
      severity: 'high',
      count: 3,
      action: 'Review Inventory',
      href: '/'
    },
    {
      title: 'Delayed Shipments',
      message: '5 shipments experiencing delays',
      severity: 'medium',
      count: 5,
      action: 'Track Shipments',
      href: '/'
    },
    {
      title: 'Supplier Issues',
      message: '2 suppliers require immediate attention',
      severity: 'high',
      count: 2,
      action: 'Contact Suppliers',
      href: '/'
    }
  ];

  const upcomingDeadlines = [
    {
      title: 'Q4 Financial Review',
      date: '2024-12-15',
      type: 'report',
      priority: 'high'
    },
    {
      title: 'Supplier Contract Renewal - TechCorp',
      date: '2024-12-20',
      type: 'contract',
      priority: 'medium'
    },
    {
      title: 'Warehouse Safety Inspection',
      date: '2024-12-22',
      type: 'compliance',
      priority: 'high'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Supply Chain Dashboard</h1>
                <p className="text-slate-600 text-sm mt-0.5">Real-time insights and operational control center</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="p-2.5 text-slate-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                <RefreshCw className="h-5 w-5" />
              </button>
              <button className="p-2.5 text-slate-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              <button className="relative p-2.5 text-slate-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Performance Indicators */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              Key Performance Indicators
            </h2>
            <p className="text-slate-600 text-sm mt-1">Real-time operational metrics and performance tracking</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Link key={index} href={stat.href}>
                  <div className={`group bg-white rounded-xl border ${stat.borderColor} p-6 hover:shadow-lg transition-all duration-200 ${stat.bgColor} hover:scale-105`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-3 rounded-xl ${stat.bgColor} border ${stat.borderColor}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        {stat.trend === 'up' ? (
                          <ArrowUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={`font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-slate-900 group-hover:text-yellow-600 transition-colors">
                        {stat.value}
                      </p>
                    </div>
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                Critical Alerts
                <Badge className="bg-red-100 text-red-700 border-red-300">{criticalAlerts.length}</Badge>
              </h2>
              <p className="text-slate-600 text-sm mt-1">Immediate attention required for these issues</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {criticalAlerts.map((alert, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'high' ? 'bg-red-50 border-red-400' : 'bg-yellow-50 border-yellow-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{alert.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {alert.count} items
                        </span>
                        <Link href={alert.href}>
                          <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors">
                            {alert.action}
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                  <Zap className="w-4 h-4 text-green-600" />
                </div>
                Quick Actions
              </h2>
              <p className="text-slate-600 text-sm mt-1">Frequently used operations and shortcuts</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <div className={`group p-4 border border-slate-200 rounded-lg transition-all duration-200 cursor-pointer ${action.color}`}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <action.icon className="h-5 w-5 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 group-hover:text-yellow-600 transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">{action.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-600" />
                Upcoming Deadlines
              </h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      deadline.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 text-sm">{deadline.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Due: {new Date(deadline.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      deadline.type === 'report' ? 'bg-blue-100 text-blue-700' :
                      deadline.type === 'contract' ? 'bg-green-100 text-green-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {deadline.type}
                    </span>
                  </div>
                ))}
              </div>
              
              <Link href="/">
                <button className="w-full mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors">
                  View Full Calendar
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
                Recent Activity
              </h2>
              <Link href="/dashboard/activity" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
                View All Activity
              </Link>
            </div>
            <p className="text-slate-600 text-sm mt-1">Latest system events and operational updates</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.status === 'success' ? 'bg-green-100 text-green-600' :
                    activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    activity.status === 'error' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{activity.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                    <span className="text-xs text-slate-500">{activity.time}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' :
                    activity.status === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-600" />
                Operational Efficiency
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Order Fulfillment Rate</span>
                  <span className="font-semibold text-slate-900">94.5%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '94.5%'}}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">On-Time Delivery</span>
                  <span className="font-semibold text-slate-900">87.2%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{width: '87.2%'}}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Supplier Performance</span>
                  <span className="font-semibold text-slate-900">91.8%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '91.8%'}}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Top Performers
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Northeast Warehouse</p>
                      <p className="text-sm text-slate-600">98.5% efficiency rating</p>
                    </div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Truck className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">FastTrack Logistics</p>
                      <p className="text-sm text-slate-600">96.2% on-time delivery</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Factory className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">TechCorp Supplies</p>
                      <p className="text-sm text-slate-600">99.1% quality rating</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}