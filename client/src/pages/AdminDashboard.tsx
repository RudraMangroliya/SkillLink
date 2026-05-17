import React, { useState, useEffect } from "react";
import { Users, Briefcase, Link as LinkIcon, Activity, Trash2, ShieldAlert, AlertTriangle, ShieldX, Server, MessageSquare, BarChart3, Database } from "lucide-react";
import axiosInstance from "../utils/axios";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  
  // For the bar chart toggle
  const [chartMetric, setChartMetric] = useState<"users" | "jobs" | "connections" | "messages">("users");
  const [chartDays, setChartDays] = useState(7);
  const [startDate, setStartDate] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let query = `?days=${chartDays}`;
      if (startDate) {
        query += `&startDate=${startDate}`;
      }
      const res = await axiosInstance.get(`/api/admin/analytics${query}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [chartDays, startDate]);

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to completely delete this user and all their data?")) return;
    try {
      await axiosInstance.delete(`/api/admin/users/${id}`);
      // Optimistic update
      setData((prev: any) => ({
        ...prev,
        recentUsers: prev.recentUsers.filter((u: any) => u._id !== id),
        metrics: { ...prev.metrics, totalUsers: prev.metrics.totalUsers - 1 }
      }));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm text-center border border-gray-100 dark:border-slate-700">
          <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  const { metrics, chartData, systemHealth, recentUsers } = data;

  // Find max value in chart data to scale the bars
  const maxChartValue = Math.max(...chartData.map((d: any) => d[chartMetric])) || 1;

  const NavItem = ({ id, icon: Icon, label }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex-shrink-0 flex items-center p-2 px-3 sm:px-4 sm:py-3 rounded-lg transition-colors ${activeTab === id ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-slate-800 hover:text-white"}`}
    >
      <Icon size={18} className="mr-2 sm:mr-3 shrink-0" /> <span className="text-sm sm:text-base font-medium whitespace-nowrap">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col md:flex-row transition-colors duration-300 w-full overflow-x-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0 bg-gradient-to-b from-slate-900 to-indigo-950 dark:from-slate-950 dark:to-slate-900 text-white flex flex-col transition-all duration-300 border-b md:border-r md:border-b-0 border-slate-800 shadow-xl z-10">
        <div className="p-3 sm:p-6 flex justify-between items-center md:justify-start border-b border-white/5">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center">
            <ShieldAlert className="mr-2 text-indigo-500" size={24} /> 
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Admin</span>
          </h1>
        </div>
        <nav className="flex-1 px-2 sm:px-4 flex flex-row md:flex-col overflow-x-auto md:overflow-y-visible space-x-2 md:space-x-0 md:space-y-2 py-2 md:py-4">
          <NavItem id="overview" icon={Activity} label="Overview" />
          <NavItem id="users" icon={Users} label="Manage Users" />
          <NavItem id="moderation" icon={ShieldAlert} label="Moderation" />
          <NavItem id="spam" icon={ShieldX} label="Spam Detection" />
          <NavItem id="reports" icon={AlertTriangle} label="Reports" />
          <NavItem id="health" icon={Server} label="System Health" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full">
        <div className="p-3 sm:p-8">
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-8 capitalize truncate">
            {activeTab.replace("-", " ")} Dashboard
          </h2>

          {activeTab === "overview" && (
            <div className="animate-fade-in">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-white dark:bg-slate-800 p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center transition-colors">
                  <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl mr-3 sm:mr-4 shrink-0"><Users size={20} className="sm:w-6 sm:h-6" /></div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">Total Users</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{metrics.totalUsers}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center transition-colors">
                  <div className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl mr-3 sm:mr-4 shrink-0"><Briefcase size={20} className="sm:w-6 sm:h-6" /></div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">Active Jobs</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{metrics.totalJobs}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center transition-colors">
                  <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl mr-3 sm:mr-4 shrink-0"><LinkIcon size={20} className="sm:w-6 sm:h-6" /></div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">Connections</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{metrics.totalConnections}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center transition-colors">
                  <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl mr-3 sm:mr-4 shrink-0"><Activity size={20} className="sm:w-6 sm:h-6" /></div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">Active Today</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{metrics.activeUsersToday}</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Chart */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-3 sm:p-6 transition-colors w-full overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                  <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white flex items-center truncate">
                    <BarChart3 className="mr-2 text-indigo-500 shrink-0" size={18} /> <span className="truncate">Platform Activity</span>
                  </h3>
                  <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
                    <select 
                      className="w-full sm:w-auto bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      value={chartDays}
                      onChange={(e: any) => setChartDays(Number(e.target.value))}
                    >
                      <option value={7}>7 Days</option>
                      <option value={14}>14 Days</option>
                      <option value={30}>30 Days</option>
                    </select>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap hidden lg:block">from</span>
                      <div className="relative">
                        <input 
                          type="date" 
                          className="w-full sm:w-auto bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          max={new Date().toISOString().split("T")[0]}
                        />
                        {startDate && (
                          <button 
                            onClick={() => setStartDate("")} 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-gray-300 dark:hover:bg-slate-500"
                            title="Clear date"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <select 
                      className="w-full sm:w-auto bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      value={chartMetric}
                      onChange={(e: any) => setChartMetric(e.target.value)}
                    >
                      <option value="users">New Users</option>
                      <option value="jobs">Jobs Posted</option>
                      <option value="connections">Connections Formed</option>
                      <option value="messages">Messages Sent</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto w-full pb-2">
                  <div className="min-w-[400px]">
                    <div className="h-48 sm:h-64 flex items-end justify-between space-x-2 sm:space-x-4 px-2">
                      {chartData.map((dataPoint: any, i: number) => {
                        const heightPercent = Math.max((dataPoint[chartMetric] / maxChartValue) * 100, 2); // min 2% height so bar is visible
                        return (
                          <div key={i} className="w-full bg-gray-100 dark:bg-slate-700/50 rounded-t-md relative group h-full flex items-end justify-center">
                            {/* Tooltip */}
                            <div className="absolute -top-8 sm:-top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] sm:text-xs py-1 px-2 rounded font-bold pointer-events-none whitespace-nowrap z-10">
                              {dataPoint[chartMetric]}
                            </div>
                            <div 
                              className="w-full bg-indigo-500 dark:bg-indigo-600 rounded-t-md transition-all duration-700 ease-out group-hover:bg-indigo-400 dark:group-hover:bg-indigo-500" 
                              style={{ height: `${heightPercent}%` }}
                            ></div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-3 sm:mt-4 text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 px-2 font-medium">
                      {chartData.map((d: any, i: number) => <span key={i} className="truncate w-full text-center">{d.name}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors animate-fade-in max-w-[100vw]">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Joined</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-sm text-gray-700 dark:text-gray-300">
                    {recentUsers.map((u: any) => (
                      <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-4 font-medium text-gray-900 dark:text-white flex items-center">
                          {u.profileImage ? (
                            <img src={u.profileImage} alt="" className="w-8 h-8 rounded-full mr-3 object-cover border border-gray-200 dark:border-slate-600" />
                          ) : (
                            <div className="w-8 h-8 rounded-full mr-3 bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-lg">👤</div>
                          )}
                          {u.name}
                        </td>
                        <td className="p-4">{u.email}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                            u.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            u.role === 'recruiter' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleDeleteUser(u._id)}
                            disabled={u.role === 'admin'}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            title={u.role === 'admin' ? "Cannot delete admin" : "Delete User"}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "health" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                <div className="flex items-center mb-6">
                  <Server className="text-indigo-500 mr-3" size={28} />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Server Metrics</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500 dark:text-gray-400">Uptime</span>
                      <span className="font-bold text-gray-900 dark:text-white">{Math.floor(systemHealth.uptime / 3600)} Hours</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `100%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500 dark:text-gray-400">Memory Usage</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {Math.round((systemHealth.totalMemory - systemHealth.freeMemory) / 1024 / 1024)} MB / {Math.round(systemHealth.totalMemory / 1024 / 1024)} MB
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${((systemHealth.totalMemory - systemHealth.freeMemory) / systemHealth.totalMemory) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                <div className="flex items-center mb-6">
                  <Database className="text-indigo-500 mr-3" size={28} />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">System Info</h3>
                </div>
                <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                  <li className="py-3 flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Platform</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{systemHealth.platform}</span>
                  </li>
                  <li className="py-3 flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">CPU Cores</span>
                    <span className="font-medium text-gray-900 dark:text-white">{systemHealth.cpus}</span>
                  </li>
                  <li className="py-3 flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Database</span>
                    <span className="font-medium text-green-600 dark:text-green-400">Connected</span>
                  </li>
                  <li className="py-3 flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">AI Service</span>
                    <span className="font-medium text-green-600 dark:text-green-400">Online</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {["moderation", "spam", "reports"].includes(activeTab) && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-slate-600 p-6 sm:p-12 text-center animate-fade-in transition-colors w-full break-words">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-50 dark:bg-slate-700/50 text-gray-400 dark:text-gray-500 mb-4 sm:mb-6">
                {activeTab === "moderation" ? <ShieldAlert size={32} className="sm:w-10 sm:h-10" /> : activeTab === "spam" ? <ShieldX size={32} className="sm:w-10 sm:h-10" /> : <AlertTriangle size={32} className="sm:w-10 sm:h-10" />}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                No Active {activeTab === "spam" ? "Spam Threats" : activeTab === "reports" ? "Reports" : "Moderation Flags"}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-xs sm:max-w-md mx-auto">
                Everything looks clean! Automated systems are currently monitoring the platform. Flagged content will appear here for manual review.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
