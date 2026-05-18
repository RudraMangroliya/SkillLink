import React, { useState, useEffect } from "react";
import { Search, MapPin, Building, Briefcase, GraduationCap, Link as LinkIcon, UserPlus, CheckCircle2, XCircle, Filter, Loader2, Sparkles, MessageSquare } from "lucide-react";
import PageLoader from "../components/PageLoader";
import axiosInstance from "../utils/axios";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

export default function ExplorePage() {
  const [keyword, setKeyword] = useState("");
  const [locationStr, setLocationStr] = useState("");
  const [skillsStr, setSkillsStr] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, string>>({});
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  const [disconnectingIds, setDisconnectingIds] = useState<Set<string>>(new Set());
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);
      if (locationStr) params.append("location", locationStr);
      if (skillsStr) params.append("skills", skillsStr);

      const res = await axiosInstance.get(`/api/profile/search?${params.toString()}`);
      setProfiles(res.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load professionals");
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionsStatus = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await axiosInstance.get("/api/connections/status");
      const statuses: Record<string, string> = {};
      const myId = user?._id;
      res.data.forEach((conn: any) => {
        const otherUserId = conn.requester === myId ? conn.recipient : conn.requester;
        statuses[otherUserId] = conn.status;
      });
      setConnectionStatuses(statuses);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchConnectionsStatus();
    } else {
      setLoading(false);
      setError("Please login to view professionals.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const delayDebounceFn = setTimeout(() => {
      fetchProfiles();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, locationStr, skillsStr, isAuthenticated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfiles();
  };

  const handleConnect = async (recipientId: string) => {
    setConnectingIds(prev => new Set(prev).add(recipientId));
    try {
      await axiosInstance.post("/api/connections/request", { recipientId });
      setConnectionStatuses(prev => ({ ...prev, [recipientId]: "Pending" }));
    } catch (err: any) {
      console.error("Connect error:", err);
      const errMsg = err.response?.data?.message || "Error";
      if (errMsg === "Connection request already exists") {
        setConnectionStatuses(prev => ({ ...prev, [recipientId]: "Pending" }));
      } else {
        setConnectionStatuses(prev => ({ ...prev, [recipientId]: "Error" }));
      }
    } finally {
      setConnectingIds(prev => {
        const next = new Set(prev);
        next.delete(recipientId);
        return next;
      });
    }
  };

  const handleDisconnect = async (recipientId: string) => {
    setDisconnectingIds(prev => new Set(prev).add(recipientId));
    try {
      await axiosInstance.delete(`/api/connections/remove/${recipientId}`);
      setConnectionStatuses(prev => {
        const next = { ...prev };
        delete next[recipientId];
        return next;
      });
    } catch (err) {
      console.error("Disconnect error:", err);
    } finally {
      setDisconnectingIds(prev => {
        const next = new Set(prev);
        next.delete(recipientId);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-8 pb-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-colors">Explore Professionals</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1 mb-6 transition-colors">Connect with industry experts and grow your network.</p>

          <form onSubmit={handleSearch} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 transition-colors">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex items-center border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-colors">
                <Search size={20} className="text-gray-400 mr-2 flex-shrink-0" />
                <input type="text"
                  placeholder="Search by name, headline, or bio..."
                  className="w-full bg-transparent text-gray-900 dark:text-white outline-none text-sm sm:text-base min-w-0 dark:placeholder-gray-400"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <div className="flex flex-col min-[350px]:flex-row gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition min-w-0"
                >
                  <Filter size={18} className="mr-2 flex-shrink-0" /> Filters
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition min-w-0"
                >
                  Search
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in transition-colors">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <input type="text"
                    placeholder="e.g. New York, San Francisco"
                    className="w-full bg-transparent text-gray-900 dark:text-white px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:placeholder-gray-400 transition-colors"
                    value={locationStr}
                    onChange={(e) => setLocationStr(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (comma separated)</label>
                  <input type="text"
                    placeholder="e.g. React, Node.js, Python"
                    className="w-full bg-transparent text-gray-900 dark:text-white px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:placeholder-gray-400 transition-colors"
                    value={skillsStr}
                    onChange={(e) => setSkillsStr(e.target.value)}
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 min-h-[50vh]">
            <PageLoader fullPage={false} label="Finding the best matches..." />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 text-center">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((person) => (
              <div key={person._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                <div className={`h-20 flex-shrink-0 relative ${person.user?.role === 'recruiter' ? 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40' : person.user?.role === 'mentor' ? 'bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40' : 'bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40'}`}>
                  {(person.user?.role === 'recruiter' || person.user?.role === 'mentor') && (
                    <span className={`absolute top-2 right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider ${person.user?.role === 'recruiter' ? 'bg-amber-500' : 'bg-teal-500'}`}>
                      {person.user?.role}
                    </span>
                  )}
                </div>
                <div className="px-5 pb-6 flex-1 flex flex-col relative">

                  {/* Avatar layout */}
                  <div className="flex justify-start -mt-10 mb-3 relative z-10">
                    <img
                      src={person.user?.profileImage || `https://ui-avatars.com/api/?name=${person.user?.name}&background=random`}
                      alt={person.user?.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-sm object-cover bg-white dark:bg-gray-800 flex-shrink-0"
                    />
                  </div>

                  <div className="flex-1 flex flex-col min-w-0">
                    <a href={`/profile/${person.user?._id}`} className="text-lg font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition truncate block">
                      {person.user?.name}
                    </a>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{person.headline || "Professional on SkillLink"}</p>

                    <div className="flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400 mt-3 gap-y-2 gap-x-4">
                      {person.location && (
                        <span className="flex items-center whitespace-nowrap"><MapPin size={14} className="mr-1 flex-shrink-0" /> <span className="truncate max-w-[120px]">{person.location}</span></span>
                      )}
                    </div>

                    {/* Skills tags preview */}
                    {person.skills && person.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {person.skills.slice(0, 3).map((skill: string, idx: number) => (
                          <span key={idx} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs px-2 py-1 rounded-md font-medium">
                            {skill}
                          </span>
                        ))}
                        {person.skills.length > 3 && (
                          <span className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-xs px-2 py-1 rounded-md font-medium">
                            +{person.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-col min-[350px]:flex-row gap-2 w-full">
                    <a href={`/profile/${person.user?._id}`} className="flex-1 bg-white dark:bg-transparent border border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-lg font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex items-center justify-center text-sm text-center min-w-0">
                      View Profile
                    </a>
                    {user?.role !== "admin" && (
                      connectionStatuses[person.user?._id] === "Accepted" ? (
                        <button 
                          onClick={() => handleDisconnect(person.user?._id)}
                          disabled={disconnectingIds.has(person.user?._id)}
                          className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 px-3 py-2 rounded-lg font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300 transition-colors flex items-center justify-center text-sm disabled:opacity-50 min-w-0"
                        >
                          {disconnectingIds.has(person.user?._id) ? <Loader2 className="animate-spin h-4 w-4" /> : "Disconnect"}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleConnect(person.user?._id)}
                          disabled={connectionStatuses[person.user?._id] === "Pending" || connectingIds.has(person.user?._id)}
                          className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center text-sm disabled:opacity-50 min-w-0"
                        >
                          {connectingIds.has(person.user?._id) || connectionStatuses[person.user?._id] === "Pending" ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <UserPlus size={16} className="mr-1 flex-shrink-0" />}
                          {connectionStatuses[person.user?._id] === "Pending" ? "Pending" : connectingIds.has(person.user?._id) ? "Connecting..." : <span className="truncate">Connect</span>}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}

            {profiles.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
                No professionals found matching your criteria. Try adjusting your filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
