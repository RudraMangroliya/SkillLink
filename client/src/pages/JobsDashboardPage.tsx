import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import axiosInstance from "../utils/axios";
import { Briefcase, Users, XCircle, CheckCircle, Calendar, Plus, Trash2, Edit, Loader2, ArrowUpRight } from "lucide-react";
import PageLoader from "../components/PageLoader";
import { Link, useNavigate } from "react-router-dom";
import { CustomSelect } from "../components/CustomSelect";

export default function JobsDashboardPage() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ total: 0, pending: 0, shortlisted: 0, rejected: 0 });
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    description: "",
    requirements: "",
    salaryRange: ""
  });

  const [scheduleModal, setScheduleModal] = useState<{jobId: string, appId: string} | null>(null);
  const [interviewData, setInterviewData] = useState({ date: "", link: "" });
  const [isScheduling, setIsScheduling] = useState(false);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [deletingJobIds, setDeletingJobIds] = useState<Set<string>>(new Set());
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await axiosInstance.get("/api/jobs/dashboard/stats");
      setStats(statsRes.data);

      if (user?.role === "recruiter") {
        const jobsRes = await axiosInstance.get("/api/jobs/dashboard/recruiter");
        setJobs(jobsRes.data);
      } else {
        const jobsRes = await axiosInstance.get("/api/jobs/dashboard/candidate");
        setJobs(jobsRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, user, navigate]);

  const handleUpdateStatus = async (jobId: string, applicationId: string, status: string, interviewDetails?: any) => {
    try {
      setUpdatingAppId(applicationId);
      const payload: any = { status };
      if (interviewDetails) {
        if (interviewDetails.date) payload.interviewDate = interviewDetails.date;
        if (interviewDetails.link) payload.interviewLink = interviewDetails.link;
      }
      
      await axiosInstance.put(`/api/jobs/${jobId}/applications/${applicationId}`, payload);
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModal || isScheduling) return;
    
    setIsScheduling(true);
    try {
      await handleUpdateStatus(scheduleModal.jobId, scheduleModal.appId, 'Shortlisted', interviewData);
      setScheduleModal(null);
      setInterviewData({ date: "", link: "" });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    setDeletingJobIds(prev => new Set(prev).add(jobId));
    try {
      await axiosInstance.delete(`/api/jobs/${jobId}`);
      setJobs(jobs.filter(job => job._id !== jobId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingJobIds(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingJob(true);
    try {
      const requirementsArray = newJob.requirements.split(",").map(r => r.trim()).filter(r => r.length > 0);
      
      if (editingJobId) {
        const res = await axiosInstance.put(`/api/jobs/${editingJobId}`, { ...newJob, requirements: requirementsArray });
        setJobs(jobs.map(j => j._id === editingJobId ? res.data : j));
      } else {
        const res = await axiosInstance.post("/api/jobs", { ...newJob, requirements: requirementsArray });
        setJobs([res.data, ...jobs]);
      }
      
      handleCloseModal();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleOpenEditModal = (job: any) => {
    setEditingJobId(job._id);
    setNewJob({
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type || "Full-time",
      description: job.description,
      requirements: job.requirements ? job.requirements.join(", ") : "",
      salaryRange: job.salaryRange || ""
    });
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingJobId(null);
    setNewJob({ title: "", company: "", location: "", type: "Full-time", description: "", requirements: "", salaryRange: "" });
  };

  if (loading) return <PageLoader fullPage={false} label="Loading jobs..." />;

  return (
    <div>
        <div className="flex flex-col min-[350px]:flex-row justify-between items-start min-[350px]:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words w-full">Job Dashboard</h1>
          {user?.role === "recruiter" && (
            <button onClick={() => setShowCreateModal(true)} className="w-full min-[350px]:w-auto justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center transition shadow-sm font-medium">
              <Plus size={20} className="mr-2 flex-shrink-0" /> Post New Job
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center overflow-hidden">
            <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4 flex-shrink-0">
              <Briefcase size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">Total Applications</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center overflow-hidden">
            <div className="p-3 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 mr-4 flex-shrink-0">
              <Users size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">Pending</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center overflow-hidden">
            <div className="p-3 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4 flex-shrink-0">
              <CheckCircle size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">Shortlisted</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.shortlisted}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center overflow-hidden">
            <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-4 flex-shrink-0">
              <XCircle size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">Rejected</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.rejected}</h3>
            </div>
          </div>
        </div>

        {/* Content based on Role */}
        {user?.role === "recruiter" ? (
          <div className="space-y-8">
            {jobs.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 text-center transition-colors">
                <p className="text-gray-500 dark:text-gray-400">You haven't posted any jobs yet.</p>
              </div>
            ) : (
              jobs.map(job => (
                <div key={job._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
                  <div className="p-3 sm:p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-slate-900/50 transition-colors">
                    <div className="min-w-0 w-full">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white break-words">{job.title}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{job.applications.length} applications</p>
                    </div>
                    <div className="flex space-x-2 shrink-0">
                      <button onClick={() => handleOpenEditModal(job)} className="p-2 text-gray-400 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 transition shadow-sm hover:shadow">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteJob(job._id)} disabled={deletingJobIds.has(job._id)} className="p-2 text-gray-400 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 transition shadow-sm hover:shadow disabled:opacity-50">
                        {deletingJobIds.has(job._id) ? <Loader2 size={18} className="animate-spin text-red-600" /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-6 overflow-x-auto">
                    {job.applications.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No applications for this job yet.</p>
                    ) : (
                      <div className="w-full">
                        <div className="hidden sm:flex items-center border-b border-gray-100 dark:border-slate-700 pb-3 mb-2">
                          <div className="w-1/3 font-semibold text-gray-500 dark:text-gray-400 text-sm">Applicant</div>
                          <div className="w-1/6 font-semibold text-gray-500 dark:text-gray-400 text-sm">Date</div>
                          <div className="w-1/6 font-semibold text-gray-500 dark:text-gray-400 text-sm">Status</div>
                          <div className="w-1/3 font-semibold text-gray-500 dark:text-gray-400 text-sm text-right">Actions</div>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                          {job.applications.map((app: any) => (
                            <div key={app._id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 group">
                              <div className="w-full sm:w-1/3 flex items-center space-x-3 min-w-0">
                                <img src={app.applicant?.profileImage || "https://via.placeholder.com/150"} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                                <div className="min-w-0">
                                  <Link to={`/profile/${app.applicant?._id}`} className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate block transition-colors">
                                    {app.applicant?.name}
                                  </Link>
                                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{app.applicant?.headline}</p>
                                </div>
                              </div>
                              <div className="w-full sm:w-1/6 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                <span className="sm:hidden font-semibold text-gray-700 dark:text-gray-300 mr-2 text-xs">Applied:</span>
                                {new Date(app.appliedAt).toLocaleDateString()}
                              </div>
                              <div className="w-full sm:w-1/6 flex items-center">
                                <span className="sm:hidden font-semibold text-gray-700 dark:text-gray-300 mr-2 text-xs">Status:</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  app.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                  app.status === 'Shortlisted' ? 'bg-green-100 text-green-700' :
                                  app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {app.status}
                                </span>
                              </div>
                              <div className="w-full sm:w-1/3 flex justify-start sm:justify-end mt-2 sm:mt-0">
                                {app.status === 'Pending' && (
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <button disabled={updatingAppId === app._id} onClick={() => handleUpdateStatus(job._id, app._id, 'Shortlisted')} className="flex-1 sm:flex-none px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-md text-xs font-semibold transition text-center disabled:opacity-50 flex items-center justify-center">
                                      {updatingAppId === app._id && <Loader2 size={12} className="animate-spin mr-1" />}
                                      Shortlist
                                    </button>
                                    <button disabled={updatingAppId === app._id} onClick={() => handleUpdateStatus(job._id, app._id, 'Rejected')} className="flex-1 sm:flex-none px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-xs font-semibold transition text-center disabled:opacity-50 flex items-center justify-center">
                                      {updatingAppId === app._id && <Loader2 size={12} className="animate-spin mr-1" />}
                                      Reject
                                    </button>
                                  </div>
                                )}
                                {app.status === 'Shortlisted' && (
                                  !app.interviewDate ? (
                                    <button onClick={() => {
                                      setScheduleModal({jobId: job._id, appId: app._id});
                                      setInterviewData({ date: "", link: "" });
                                    }} className="w-full sm:w-auto px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-xs font-semibold transition flex items-center justify-center">
                                      <Calendar size={14} className="mr-1" /> Schedule
                                    </button>
                                  ) : (
                                    <div className="w-full sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center bg-gray-50 dark:bg-slate-700/30 sm:bg-transparent sm:dark:bg-transparent p-2 sm:p-0 rounded-lg">
                                      <div>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-0.5 flex items-center justify-start sm:justify-end"><Calendar size={12} className="mr-1" /> Scheduled</p>
                                        <p className="text-xs text-gray-900 dark:text-white">{new Date(app.interviewDate).toLocaleString()}</p>
                                      </div>
                                      <button onClick={() => {
                                        const dateObj = new Date(app.interviewDate);
                                        const tzOffset = dateObj.getTimezoneOffset() * 60000;
                                        const localISOTime = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0,16);
                                        setScheduleModal({jobId: job._id, appId: app._id});
                                        setInterviewData({ date: localISOTime, link: app.interviewLink || "" });
                                      }} className="text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-md sm:bg-transparent sm:px-0 sm:py-0 sm:underline mt-0 sm:mt-1 font-medium transition whitespace-nowrap">Reschedule</button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden min-w-0">
            <div className="p-3 sm:p-6 border-b border-gray-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Applications</h2>
            </div>
            <div className="p-3 sm:p-6 min-w-0">
              {jobs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">You haven't applied to any jobs yet.</p>
              ) : (
                <div className="space-y-4">
                  {jobs.map(job => {
                    const myApp = job.applications.find((app: any) => String(app.applicant) === String(user?._id) || String(app.applicant?._id) === String(user?._id));
                    if (!myApp) return null;
                    return (
                      <div key={job._id} className="border border-gray-100 dark:border-slate-700/60 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-indigo-500/20 dark:hover:border-indigo-500/30 transition-all duration-300 bg-white dark:bg-slate-800/40 shadow-sm hover:shadow-md min-w-0">
                        <div className="flex gap-4 items-start min-w-0">
                          <div className="flex-shrink-0 w-11 h-11 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30 shadow-sm">
                            <Briefcase size={20} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg break-words leading-tight">{job.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mt-0.5 break-words">{job.company} &bull; {job.location}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2.5 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                              Applied on {new Date(myApp.appliedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 shrink-0 self-start md:self-auto w-full md:w-auto">
                          {myApp.interviewDate && (
                            <div className="flex flex-col items-start sm:items-end bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/20 rounded-xl p-3.5 text-left sm:text-right w-full sm:w-auto">
                              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold mb-1 flex items-center gap-1.5 justify-start sm:justify-end">
                                <Calendar size={14} className="shrink-0" />
                                <span>Interview Scheduled</span>
                              </p>
                              <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mt-0.5">
                                {new Date(myApp.interviewDate).toLocaleString()}
                              </p>
                              {myApp.interviewLink && (
                                <a 
                                  href={myApp.interviewLink.startsWith('http') ? myApp.interviewLink : `https://${myApp.interviewLink}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold hover:underline mt-2.5 transition-colors group"
                                >
                                  Join Meeting
                                  <ArrowUpRight size={15} className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </a>
                              )}
                            </div>
                          )}
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase border whitespace-nowrap self-start sm:self-center text-center ${
                            myApp.status === 'Pending' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30' :
                            myApp.status === 'Shortlisted' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30' :
                            myApp.status === 'Rejected' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30' : 
                            'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-sky-200/50 dark:border-sky-900/30'
                          }`}>
                            {myApp.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-slate-700">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{editingJobId ? "Edit Job" : "Post New Job"}</h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleCreateJob} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
                  <input type="text" id="jobTitle" name="jobTitle" required value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Software Engineer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                  <input type="text" id="jobCompany" name="jobCompany" required value={newJob.company} onChange={e => setNewJob({...newJob, company: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Tech Corp" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <input type="text" id="jobLocation" name="jobLocation" required value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Remote, NY, etc." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Type</label>
                  <CustomSelect
                    value={newJob.type}
                    onChange={val => setNewJob({...newJob, type: val})}
                    options={["Full-time", "Part-time", "Contract", "Internship", "Remote"]}
                    triggerClassName="bg-white dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea id="jobDescription" name="jobDescription" required rows={4} value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Describe the role..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requirements (comma separated)</label>
                <input type="text" id="jobRequirements" name="jobRequirements" required value={newJob.requirements} onChange={e => setNewJob({...newJob, requirements: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="React, Node.js, 3+ years experience" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salary Range</label>
                <input type="text" id="jobSalaryRange" name="jobSalaryRange" value={newJob.salaryRange} onChange={e => setNewJob({...newJob, salaryRange: e.target.value})} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="$100k - $120k" />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 sm:gap-0">
                <button type="button" onClick={handleCloseModal} disabled={isCreatingJob} className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-center disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isCreatingJob} className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-center disabled:opacity-50 flex items-center justify-center">
                  {isCreatingJob && <Loader2 size={16} className="animate-spin mr-2" />}
                  {isCreatingJob ? (editingJobId ? "Updating..." : "Posting...") : (editingJobId ? "Update Job" : "Post Job")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-y-auto max-h-screen p-4 sm:p-8 border border-gray-200 dark:border-slate-700 relative z-10 transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Schedule Interview</h2>
              <button onClick={() => setScheduleModal(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleScheduleInterview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <input type="datetime-local" id="interviewDate" name="interviewDate" required value={interviewData.date} onChange={e => setInterviewData({...interviewData, date: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link / Location</label>
                <input type="text" id="interviewLink" name="interviewLink" required value={interviewData.link} onChange={e => setInterviewData({...interviewData, link: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://zoom.us/j/123456789" />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setScheduleModal(null)} disabled={isScheduling} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isScheduling} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center">
                  {isScheduling ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Scheduling...</>
                  ) : "Save Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
