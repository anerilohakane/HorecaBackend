'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Filter, Search, CheckCircle, 
  XCircle, Clock, FileText, Download, Upload, Users,
  User, Building, TrendingUp, Target, Loader2,
  UserCheck, UserX, MoreVertical, Eye, Edit,
  Paperclip, MapPin, Mail, Phone
} from 'lucide-react';

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchLeaves();
  }, [filter]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' ? '/api/payroll/leaves' : `/api/payroll/leaves?status=${filter}`;
      const response = await fetch(url);
      const data = await response.json();
      setLeaves(data.leaves || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
      Approved: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
      Rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
      Cancelled: { color: 'bg-slate-50 text-slate-700 border-slate-200', icon: XCircle },
    };
    
    const { color, icon: Icon } = statusConfig[status] || statusConfig.Pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border ${color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const getLeaveTypeBadge = (type) => {
    const typeConfig = {
      'Annual': { color: 'bg-blue-50 text-blue-700 border-blue-200' },
      'Sick': { color: 'bg-red-50 text-red-700 border-red-200' },
      'Personal': { color: 'bg-purple-50 text-purple-700 border-purple-200' },
      'Maternity': { color: 'bg-pink-50 text-pink-700 border-pink-200' },
      'Paternity': { color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      'Emergency': { color: 'bg-orange-50 text-orange-700 border-orange-200' },
    };
    
    const { color } = typeConfig[type] || typeConfig.Annual;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${color}`}>
        {type}
      </span>
    );
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      const response = await fetch(`/api/payroll/leaves/${leaveId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Approved' }),
      });

      if (response.ok) {
        fetchLeaves(); // Refresh data
      }
    } catch (error) {
      console.error('Error approving leave:', error);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      const response = await fetch(`/api/payroll/leaves/${leaveId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Rejected' }),
      });

      if (response.ok) {
        fetchLeaves(); // Refresh data
      }
    } catch (error) {
      console.error('Error rejecting leave:', error);
    }
  };

  const filteredLeaves = leaves.filter(leave => {
    const fullName = `${leave.employee?.personalDetails?.firstName} ${leave.employee?.personalDetails?.lastName}`.toLowerCase();
    const employeeId = leave.employee?.employeeId?.toLowerCase() || '';
    const leaveType = leave.leaveType?.toLowerCase() || '';
    return fullName.includes(searchTerm.toLowerCase()) || 
           employeeId.includes(searchTerm.toLowerCase()) ||
           leaveType.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          <span className="text-slate-600 font-medium">Loading leave data...</span>
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
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Leave Management</h1>
                <p className="text-slate-600">Manage and track employee leave applications</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium">
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors shadow-sm">
                <Plus className="w-4 h-4" />
                Apply Leave
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
                  <p className="text-sm font-medium text-slate-600">Total Applications</p>
                  <p className="text-2xl font-bold text-slate-900">47</p>
                  <p className="text-xs text-slate-500 mt-1">This month</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-700">12</p>
                  <p className="text-xs text-yellow-600 mt-1">Awaiting review</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Approved</p>
                  <p className="text-2xl font-bold text-green-700">32</p>
                  <p className="text-xs text-green-600 mt-1">68% approval rate</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-700">3</p>
                  <p className="text-xs text-red-600 mt-1">6.4% rejection rate</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
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
                { id: 'all', label: 'All Applications', count: 47 },
                { id: 'Pending', label: 'Pending', count: 12 },
                { id: 'Approved', label: 'Approved', count: 32 },
                { id: 'Rejected', label: 'Rejected', count: 3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                    filter === tab.id
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    filter === tab.id 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leave Applications */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                    <FileText className="w-4 h-4 text-yellow-600" />
                  </div>
                  {filter === 'all' ? 'All Leave Applications' : `${filter} Applications`}
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  {filteredLeaves.length} applications found
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                </div>
                
                <button className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {filteredLeaves.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No leave applications</h3>
                <p className="text-slate-600 mb-4">
                  {filter === 'all' 
                    ? 'No leave applications found.' 
                    : `No ${filter.toLowerCase()} leave applications found.`
                  }
                </p>
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors">
                  <Plus className="w-4 h-4" />
                  Apply for Leave
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLeaves.map((leave) => (
                  <div key={leave._id} className="border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center shadow-sm">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-slate-900 text-lg">
                                {leave.employee?.personalDetails?.firstName} {leave.employee?.personalDetails?.lastName}
                              </h4>
                              {getStatusBadge(leave.status)}
                              {getLeaveTypeBadge(leave.leaveType)}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                              <span>ID: {leave.employee?.employeeId}</span>
                              <span>•</span>
                              <span>Applied: {new Date(leave.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        {leave.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveLeave(leave._id)}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectLeave(leave._id)}
                              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                            <Calendar className="w-4 h-4" />
                            Start Date
                          </div>
                          <div className="font-semibold text-slate-900">
                            {new Date(leave.startDate).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                            <Calendar className="w-4 h-4" />
                            End Date
                          </div>
                          <div className="font-semibold text-slate-900">
                            {new Date(leave.endDate).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                            <Clock className="w-4 h-4" />
                            Duration
                          </div>
                          <div className="font-semibold text-slate-900">
                            {leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <div className="text-slate-600 text-sm mb-1">Reason:</div>
                        <div className="text-slate-900">{leave.reason}</div>
                      </div>
                      
                      {leave.attachments && leave.attachments.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Paperclip className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-600">
                            {leave.attachments.length} attachment{leave.attachments.length !== 1 ? 's' : ''}
                          </span>
                          <button className="text-blue-600 hover:text-blue-700 font-medium">
                            View Files
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mt-8">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Target className="w-3 h-3 text-yellow-600" />
              </div>
              Quick Actions
            </h3>
            <p className="text-slate-600 text-sm mt-1">Common leave management tasks</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all group">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <span className="font-medium text-slate-900">New Application</span>
                <span className="text-sm text-slate-600 mt-1">Apply for leave</span>
              </button>
              
              <button className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all group">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-yellow-200 transition-colors">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="font-medium text-slate-900">Bulk Approve</span>
                <span className="text-sm text-slate-600 mt-1">Approve multiple</span>
              </button>
              
              <button className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all group">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
                <span className="font-medium text-slate-900">Export Report</span>
                <span className="text-sm text-slate-600 mt-1">Download data</span>
              </button>
              
              <button className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all group">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <span className="font-medium text-slate-900">Analytics</span>
                <span className="text-sm text-slate-600 mt-1">View insights</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}