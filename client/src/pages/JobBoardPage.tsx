import React, { useState, useEffect } from "react";
import { Search, MapPin, Building, DollarSign, Clock, BookmarkPlus, Loader2, CheckCircle2, X } from "lucide-react";
import PageLoader from "../components/PageLoader";
import axiosInstance from "../utils/axios";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import JobsDashboardPage from "./JobsDashboardPage";
import SEO from "../components/SEO";

export default function JobBoardPage() {
  const [activeTab, setActiveTab] = useState<"board" | "dashboard">("board");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [showRecommended, setShowRecommended] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("relevant");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [applyingIds, setApplyingIds] = useState<Set<string>>(new Set());
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axiosInstance.get("/api/jobs");
        setJobs(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };

    const fetchSavedJobs = async () => {
      if (isAuthenticated) {
        try {
          const res = await axiosInstance.get("/api/jobs/saved");
          setSavedJobs(res.data.map((j: any) => j._id));
        } catch (err) {
          console.error(err);
        }
      }
    };
    const fetchRecommendedJobs = async () => {
      if (isAuthenticated) {
        try {
          const res = await axiosInstance.get("/api/recommendations/jobs");
          setRecommendedJobs(res.data);
        } catch (err) {
          console.error("Failed to fetch recommendations", err);
        }
      }
    };

    if (isAuthenticated) {
      fetchJobs();
      fetchSavedJobs();
      fetchRecommendedJobs();
    } else {
      setLoading(false);
      setError("Please login to view jobs.");
    }
  }, [isAuthenticated]);

  const handleToggleSave = async (jobId: string) => {
    setSavingIds(prev => new Set(prev).add(jobId));
    try {
      await axiosInstance.post(`/api/jobs/${jobId}/save`);
      if (savedJobs.includes(jobId)) {
        setSavedJobs(savedJobs.filter(id => id !== jobId));
      } else {
        setSavedJobs([...savedJobs, jobId]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  const handleApply = async (jobId: string) => {
    setApplyingIds(prev => new Set(prev).add(jobId));
    try {
      await axiosInstance.post(`/api/jobs/${jobId}/apply`);
      // Update local state to reflect the new application
      setJobs(jobs.map(job => {
        if (job._id === jobId) {
          return {
            ...job,
            applications: [...job.applications, { applicant: user?._id, status: "Pending", appliedAt: new Date() }]
          };
        }
        return job;
      }));
    } catch (err) {
      console.error("Failed to apply", err);
    } finally {
      setApplyingIds(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  const filteredJobs = jobs.filter((job: any) => {
    const titleMatch = job.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const companyMatch = job.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const locationMatch = searchLocation === "" || job.location?.toLowerCase().includes(searchLocation.toLowerCase());
    const typeMatch = selectedJobTypes.length === 0 || selectedJobTypes.includes(job.type);
    
    return (titleMatch || companyMatch) && locationMatch && typeMatch;
  });

  let jobsToDisplay = showRecommended ? recommendedJobs : filteredJobs;
  if (showSavedOnly) {
    jobsToDisplay = jobsToDisplay.filter((job: any) => savedJobs.includes(job._id));
  }
  
  if (sortBy === "recent") {
    jobsToDisplay = [...jobsToDisplay].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-6 sm:pt-8 pb-12 transition-colors duration-300">
      <SEO 
        title="Find Tech & Developer Jobs" 
        description="Search recent job listings, retrieve AI recommended job positions, and apply for technical openings on SkillLink's smart job board."
      />
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        
        {/* Header & Search */}
        <div className="bg-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 sm:mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-white opacity-5 rounded-full blur-2xl sm:blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex justify-between items-start mb-2 sm:mb-4 relative z-10">
            <h1 className="text-2xl sm:text-4xl font-extrabold break-words">Find your dream job</h1>
          </div>
          <p className="text-indigo-100 text-sm sm:text-lg mb-6 sm:mb-8 relative z-10 max-w-2xl">
            Explore opportunities matching your skills and experience.
          </p>
          
          <div className="bg-white dark:bg-gray-800 p-2 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center shadow-lg max-w-4xl relative z-10 gap-2 sm:gap-0 transition-colors">
            <div className="flex-1 flex items-center px-2 sm:px-4 border-b sm:border-b-0 sm:border-r border-gray-200">
              <Search size={20} className="text-gray-400 mr-2 sm:mr-3 flex-shrink-0" />
              <input type="text" 
                placeholder="Job title or company" 
                className="w-full py-2 sm:py-3 bg-transparent text-gray-900 dark:text-white outline-none text-sm sm:text-base min-w-0 dark:placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="hidden md:flex flex-1 items-center px-4">
              <MapPin size={20} className="text-gray-400 mr-3 flex-shrink-0" />
              <input type="text" 
                placeholder="Location or Remote" 
                className="w-full py-3 bg-transparent text-gray-900 dark:text-white outline-none dark:placeholder-gray-400"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </div>
            <button className="bg-indigo-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-indigo-700 transition w-full sm:w-auto text-sm sm:text-base whitespace-nowrap">
              Search
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200 dark:border-gray-700">
          <button 
            className={`pb-3 font-semibold transition ${activeTab === 'board' && !showSavedOnly ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => {setActiveTab('board'); setShowSavedOnly(false);}}
          >
            Job Board
          </button>
          {user?.role !== "recruiter" && user?.role !== "admin" && (
            <button 
              className={`pb-3 font-semibold transition ${activeTab === 'board' && showSavedOnly ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => {setActiveTab('board'); setShowSavedOnly(true);}}
            >
              Saved Jobs
            </button>
          )}
          <button 
            className={`pb-3 font-semibold transition ${activeTab === 'dashboard' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
        </div>

        {activeTab === 'board' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Filters Sidebar */}
            <div className="hidden lg:block space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">Job Type</h3>
              <div className="space-y-3">
                {["Full-time", "Part-time", "Contract", "Freelance", "Internship"].map(type => (
                  <label key={type} className="flex items-center text-gray-600 dark:text-gray-300 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                    <input type="checkbox" 
                      className="mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                      checked={selectedJobTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedJobTypes([...selectedJobTypes, type]);
                        } else {
                          setSelectedJobTypes(selectedJobTypes.filter(t => t !== type));
                        }
                      }}
                    /> {type}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Job List */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex flex-col min-[450px]:flex-row min-[450px]:justify-between items-start min-[450px]:items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm transition-colors gap-4">
              <span className="text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">Showing <span className="text-gray-900 dark:text-white font-bold">{jobsToDisplay.length}</span> jobs</span>
              
              <div className="flex flex-wrap items-center gap-3 w-full min-[450px]:w-auto">
                <label className="flex items-center cursor-pointer">
                  <div className="relative flex-shrink-0">
                    <input type="checkbox" className="sr-only" checked={showRecommended} onChange={() => setShowRecommended(!showRecommended)} />
                    <div className={`block w-10 h-6 rounded-full transition ${showRecommended ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-600'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${showRecommended ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">For You</span>
                </label>

                <div className="relative w-full min-[300px]:w-auto flex-1 min-[300px]:flex-none">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full appearance-none bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 font-medium py-2 pl-3 pr-8 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm cursor-pointer transition-colors shadow-sm">
                    <option value="relevant">Most relevant</option>
                    <option value="recent">Most recent</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20 min-h-[50vh]">
                <PageLoader fullPage={false} label="Loading jobs..." />
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 text-center">
                {error}
              </div>
            ) : jobsToDisplay.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-gray-500 transition-colors">
                {showRecommended ? "No personalized recommendations available yet." : "No jobs found matching your criteria."}
              </div>
            ) : (
              jobsToDisplay.map(job => (
                <div key={job._id} onClick={() => setSelectedJob(job)} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-500/50 transition-all group cursor-pointer flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center p-1 sm:p-2 flex-shrink-0 bg-white dark:bg-gray-900 shadow-sm group-hover:scale-105 transition-transform self-start">
                    {/* Fallback to initials if no logo */}
                    <div className="font-bold text-gray-400 text-lg sm:text-xl">
                      {job.company ? job.company.charAt(0).toUpperCase() : "J"}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">{job.title}</h3>
                        <div className="flex flex-wrap items-center text-gray-600 dark:text-gray-400 mt-1 mb-3 text-xs sm:text-sm font-medium gap-y-1 gap-x-2">
                          <span className="flex items-center whitespace-nowrap"><Building size={14} className="mr-1 flex-shrink-0" /> <span className="truncate max-w-[120px] sm:max-w-xs">{job.company}</span></span>
                          <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                          {job.location && (
                            <span className="flex items-center whitespace-nowrap"><MapPin size={14} className="mr-1 flex-shrink-0" /> <span className="truncate max-w-[120px] sm:max-w-xs">{job.location}</span></span>
                          )}
                        </div>
                      </div>
                      {user?.role !== "recruiter" && user?.role !== "admin" && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleSave(job._id); }}
                          disabled={savingIds.has(job._id)}
                          className={`p-2 rounded-full border transition flex items-center justify-center disabled:opacity-50 ${savedJobs.includes(job._id) ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                        >
                          {savingIds.has(job._id) ? <Loader2 className="animate-spin h-5 w-5" /> : <BookmarkPlus size={20} className={savedJobs.includes(job._id) ? 'fill-indigo-600' : ''} />}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2 sm:px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap">
                        <Clock size={12} className="mr-1 flex-shrink-0" /> {job.type || "Full-time"}
                      </span>
                      {job.salary && (
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap">
                          <DollarSign size={12} className="mr-0.5 flex-shrink-0" /> {job.salary}
                        </span>
                      )}
                    </div>

                    {/* Apply Button */}
                    <div className="mt-4 flex justify-end">
                      {user?.role !== "recruiter" && user?.role !== "admin" && (
                        job.applications?.some((app: any) => String(app.applicant) === String(user?._id) || String(app.applicant?._id) === String(user?._id)) ? (
                          <button disabled onClick={(e) => e.stopPropagation()} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium text-sm cursor-not-allowed flex items-center">
                            <CheckCircle2 size={16} className="mr-1" /> Applied
                          </button>
                        ) : (
                          <button disabled={applyingIds.has(job._id)} onClick={(e) => { e.stopPropagation(); handleApply(job._id); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center min-w-[100px]">
                            {applyingIds.has(job._id) ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            {applyingIds.has(job._id) ? "Applying..." : "Apply Now"}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        ) : (
          <JobsDashboardPage />
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative transition-colors">
            <button onClick={() => setSelectedJob(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={24} />
            </button>
            <div className="pr-10 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedJob.title}</h2>
              <div className="flex flex-wrap items-center text-gray-600 dark:text-gray-400 mt-2 text-sm font-medium gap-y-1 gap-x-2">
                <span className="flex items-center"><Building size={16} className="mr-1" /> {selectedJob.company}</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="flex items-center"><MapPin size={16} className="mr-1" /> {selectedJob.location || "Remote"}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-medium rounded-lg">
                  <Clock size={14} className="mr-1" /> {selectedJob.type || "Full-time"}
                </span>
                {selectedJob.salary && (
                  <span className="inline-flex items-center px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg">
                    <DollarSign size={14} className="mr-1" /> {selectedJob.salary}
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About the role</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedJob.description}</p>
              </div>
              
              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Requirements</h3>
                  <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
                    {selectedJob.requirements.map((req: string, i: number) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {user?.role !== "recruiter" && user?.role !== "admin" && (
              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end space-x-3">
                <button 
                  onClick={() => handleToggleSave(selectedJob._id)}
                  disabled={savingIds.has(selectedJob._id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition border flex items-center disabled:opacity-50 ${savedJobs.includes(selectedJob._id) ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                  {savingIds.has(selectedJob._id) ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <BookmarkPlus size={18} className={`mr-2 ${savedJobs.includes(selectedJob._id) ? 'fill-indigo-600' : ''}`} />} 
                  {savingIds.has(selectedJob._id) ? "Saving..." : savedJobs.includes(selectedJob._id) ? "Saved" : "Save Job"}
                </button>
                {selectedJob.applications?.some((app: any) => String(app.applicant) === String(user?._id) || String(app.applicant?._id) === String(user?._id)) ? (
                  <button disabled className="px-6 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium text-sm cursor-not-allowed flex items-center">
                    <CheckCircle2 size={16} className="mr-1" /> Applied
                  </button>
                ) : (
                  <button disabled={applyingIds.has(selectedJob._id)} onClick={() => { handleApply(selectedJob._id); }} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[120px]">
                    {applyingIds.has(selectedJob._id) ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                    {applyingIds.has(selectedJob._id) ? "Applying..." : "Apply Now"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
