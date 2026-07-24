import React, { useState, useEffect } from "react";
import { Users, Briefcase, Link as LinkIcon, Activity, Trash2, ShieldAlert, AlertTriangle, ShieldX, Server, MessageSquare, BarChart3, Database, Loader2, Calendar, Menu, X, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PageLoader from "../components/PageLoader";
import axiosInstance from "../utils/axios";
import { CustomSelect } from "../components/CustomSelect";
import { CustomDatePicker } from "../components/CustomDatePicker";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  
  // Navigation tab definitions
  const tabs = [
    { id: "overview", label: "Overview", icon: Activity, desc: "Analytics & platform KPIs" },
    { id: "users", label: "Manage Users", icon: Users, desc: "User accounts & permission roles" },
    { id: "moderation", label: "Moderation", icon: ShieldAlert, desc: "Content moderation queue" },
    { id: "spam", label: "Spam Detection", icon: ShieldX, desc: "Automated spam security flags" },
    { id: "reports", label: "Reports", icon: AlertTriangle, desc: "User reports & issue tickets" },
    { id: "health", label: "System Health", icon: Server, desc: "Server performance & DB info" },
  ];

  // For the bar chart toggle
  const [chartMetric, setChartMetric] = useState<"users" | "jobs" | "connections" | "messages">("users");
  const [chartDays, setChartDays] = useState(7);
  const [startDate, setStartDate] = useState("");
  const [deletingUserIds, setDeletingUserIds] = useState<Set<string>>(new Set());

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
    setDeletingUserIds(prev => new Set(prev).add(id));
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
    } finally {
      setDeletingUserIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (loading) {
    return <PageLoader label="Loading dashboard..." />;
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

  const currentTabObj = tabs.find(t => t.id === activeTab) || tabs[0];
  const CurrentIcon = currentTabObj.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col md:flex-row transition-colors duration-300 w-full overflow-x-hidden">
      {/* Mobile Top Header (Visible on small screens < md) */}
      <div className="md:hidden sticky top-0 z-30 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white px-3.5 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 bg-indigo-600/20 rounded-lg border border-indigo-500/30 shrink-0">
            <ShieldAlert className="text-indigo-400" size={18} />
          </div>
          <span className="text-base font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent shrink-0">
            Admin
          </span>
          <span className="text-slate-700 shrink-0">/</span>
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-full truncate">
            <CurrentIcon size={13} className="text-indigo-400 shrink-0" />
            <span className="truncate">{currentTabObj.label}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all font-medium text-xs shrink-0 active:scale-95 ml-2"
        >
          {isMobileMenuOpen ? (
            <>
              <span>Close</span>
              <X size={15} />
            </>
          ) : (
            <>
              <span>Menu</span>
              <ChevronDown size={14} className="transition-transform duration-200" />
            </>
          )}
        </button>
      </div>

      {/* Mobile Animated Dropdown Drawer & Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide Down Menu */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="md:hidden fixed top-[53px] left-0 right-0 z-50 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 shadow-2xl p-3.5 max-h-[calc(100vh-60px)] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Navigation Tabs</span>
                <span className="text-[11px] text-indigo-400 font-medium">{tabs.length} options</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl text-left transition-all duration-150 ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold ring-1 ring-indigo-400/30"
                          : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`p-2 rounded-lg ${isActive ? "bg-white/20 text-white" : "bg-slate-700/60 text-indigo-400"}`}>
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{tab.label}</p>
                          <p className={`text-[11px] truncate ${isActive ? "text-indigo-100" : "text-slate-400"}`}>{tab.desc}</p>
                        </div>
                      </div>
                      {isActive && <Check size={16} className="text-white shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Visible on screens >= md) */}
      <div className="hidden md:flex w-64 shrink-0 bg-gradient-to-b from-slate-900 to-indigo-950 dark:from-slate-950 dark:to-slate-900 text-white flex-col transition-all duration-300 border-r border-slate-800 shadow-xl z-10 min-h-screen">
        <div className="p-6 flex justify-between items-center border-b border-white/5">
          <h1 className="text-2xl font-bold flex items-center">
            <ShieldAlert className="mr-2.5 text-indigo-500" size={26} /> 
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Admin</span>
          </h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 font-semibold" 
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <Icon size={20} className="mr-3 shrink-0" /> 
                <span className="text-sm font-medium truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-3 sm:p-6 transition-colors w-full">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-5 gap-3.5 border-b border-gray-100 dark:border-slate-700/60 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                      <BarChart3 size={20} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                        Platform Activity
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Monitor platform growth & daily interaction analytics
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                    {/* Time Range Filter Group */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 bg-gray-100/90 dark:bg-slate-700/50 p-1 rounded-xl border border-gray-200/80 dark:border-slate-600/80 w-full sm:w-auto min-w-0">
                      <CustomSelect 
                        className="flex-1 sm:flex-none min-w-0"
                        triggerClassName="bg-white dark:bg-slate-800 border-none text-gray-900 dark:text-white px-2.5 text-xs font-semibold rounded-lg shadow-2xs h-8 min-w-[75px]"
                        value={chartDays}
                        onChange={(val) => setChartDays(Number(val))}
                        options={[
                          { value: 7, label: "7 Days" },
                          { value: 14, label: "14 Days" },
                          { value: 30, label: "30 Days" }
                        ]}
                      />

                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 px-1 shrink-0">from</span>

                      <CustomDatePicker
                        value={startDate}
                        onChange={setStartDate}
                        maxDate={new Date().toISOString().split("T")[0]}
                        placeholder="Start Date"
                        className="flex-1 sm:flex-none min-w-0 w-full sm:w-auto"
                        triggerClassName="bg-white dark:bg-slate-800 border-none text-gray-900 dark:text-white text-xs font-semibold px-2 rounded-lg shadow-2xs h-8 min-w-0"
                      />
                    </div>

                    {/* Metric Display Selector */}
                    <div className="w-full sm:w-auto">
                      <CustomSelect 
                        className="w-full sm:w-auto min-w-[170px]"
                        triggerClassName="bg-indigo-50/90 hover:bg-indigo-100/90 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 px-3.5 text-xs font-bold rounded-xl shadow-2xs h-[42px]"
                        value={chartMetric}
                        onChange={setChartMetric}
                        options={[
                          { value: "users", label: "New Users" },
                          { value: "jobs", label: "Jobs Posted" },
                          { value: "connections", label: "Connections Formed" },
                          { value: "messages", label: "Messages Sent" }
                        ]}
                      />
                    </div>
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
            <div className="animate-fade-in w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {recentUsers.map((u: any) => (
                  <div 
                    key={u._id} 
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Header: User Profile & Actions */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                          {u.profileImage ? (
                            <img 
                              src={u.profileImage} 
                              alt="" 
                              className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-slate-600 shrink-0" 
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-base font-bold shrink-0 border border-indigo-100 dark:border-slate-600">
                              {u.name ? u.name.charAt(0).toUpperCase() : '👤'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white text-base truncate" title={u.name}>
                              {u.name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium break-all mt-0.5" title={u.email}>
                              {u.email}
                            </p>
                          </div>
                        </div>

                        {/* Delete User Action */}
                        <button 
                          onClick={() => handleDeleteUser(u._id)}
                          disabled={u.role === 'admin' || deletingUserIds.has(u._id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0 min-w-[34px] min-h-[34px]"
                          title={u.role === 'admin' ? "Cannot delete admin" : "Delete User"}
                        >
                          {deletingUserIds.has(u._id) ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Footer: Metadata & Role Badge */}
                    <div className="flex items-center justify-between pt-3.5 border-t border-gray-100 dark:border-slate-700/60 text-xs mt-1">
                      <span className={`px-3 py-1 rounded-full font-semibold capitalize ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        u.role === 'recruiter' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        u.role === 'mentor' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
                      }`}>
                        {u.role}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 font-medium">
                        Joined {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
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
