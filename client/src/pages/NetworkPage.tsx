import React, { useState, useEffect } from "react";
import { Search, UserPlus, CheckCircle2, XCircle, Users, ExternalLink, Briefcase, GraduationCap, X, MessageSquare, Check, UserCheck, Clock } from "lucide-react";
import PageLoader from "../components/PageLoader";
import axiosInstance from "../utils/axios";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { NetworkCardSkeleton } from "../components/Skeletons";
import BorderGlow from "../components/BorderGlow";

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<"connections" | "requests" | "suggestions">("suggestions");
  const [connections, setConnections] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [disconnectingIds, setDisconnectingIds] = useState<Set<string>>(new Set());
  const [confirmDisconnectId, setConfirmDisconnectId] = useState<string | null>(null);
  const [startingChatIds, setStartingChatIds] = useState<Set<string>>(new Set());
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const handleStartChat = async (userId: string) => {
    setStartingChatIds(prev => new Set(prev).add(userId));
    try {
      await axiosInstance.post("/api/chats", { userId });
      navigate("/chat");
    } catch (err) {
      console.error(err);
    } finally {
      setStartingChatIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  useEffect(() => {
    if (activeTab === "connections") fetchConnections();
    if (activeTab === "requests") fetchRequests();
    if (activeTab === "suggestions") fetchSuggestions();
  }, [activeTab]);

  useEffect(() => {
    const handleNewNotification = (e: any) => {
      const notification = e.detail;
      if (notification.type === 'connection_request' && activeTab === 'requests') {
        fetchRequests();
      } else if (notification.type === 'accepted' && activeTab === 'connections') {
        fetchConnections();
      }
    };
    
    const handleConnectionRemoved = () => {
      if (activeTab === 'connections') {
        fetchConnections();
      } else if (activeTab === 'suggestions') {
        fetchSuggestions();
      }
    };

    window.addEventListener('new_notification', handleNewNotification);
    window.addEventListener('connection_removed', handleConnectionRemoved);
    return () => {
      window.removeEventListener('new_notification', handleNewNotification);
      window.removeEventListener('connection_removed', handleConnectionRemoved);
    };
  }, [activeTab]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/connections");
      setConnections(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/connections/pending");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/profile/suggested");
      setSuggestions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await axiosInstance.post(`/api/connections/accept/${id}`);
      setRequests(requests.filter(r => r._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReject = async (id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await axiosInstance.post(`/api/connections/reject/${id}`);
      setRequests(requests.filter(r => r._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDisconnect = async (targetUserId: string) => {
    setDisconnectingIds(prev => new Set(prev).add(targetUserId));
    try {
      await axiosInstance.delete(`/api/connections/remove/${targetUserId}`);
      setConnections(prev => prev.filter(c => (c.requester._id !== targetUserId && c.recipient._id !== targetUserId)));
    } catch (err) {
      console.error("Disconnect error:", err);
    } finally {
      setDisconnectingIds(prev => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  const handleDisconnectClick = (targetUserId: string) => {
    if (confirmDisconnectId === targetUserId) {
      setConfirmDisconnectId(null);
      handleDisconnect(targetUserId);
    } else {
      setConfirmDisconnectId(targetUserId);
      setTimeout(() => {
        setConfirmDisconnectId(prev => (prev === targetUserId ? null : prev));
      }, 4000);
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "suggestions":
        return "Suggested for you";
      case "requests":
        return "Pending Requests";
      case "connections":
        return "My Connections";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-4 sm:pt-8 pb-12 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/80 p-2 sm:p-3 shrink-0 h-max transition-colors">
            <div className="px-3 py-2 text-xs font-bold tracking-wider text-gray-400 dark:text-slate-400 uppercase">
              Manage My Network
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <button 
                onClick={() => setActiveTab("suggestions")}
                className={`flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "suggestions" 
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs" 
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <UserPlus size={18} className="shrink-0" />
                <span>Suggested People</span>
              </button>
              {user?.role !== "admin" && (
                <>
                  <button 
                    onClick={() => setActiveTab("requests")}
                    className={`flex items-center justify-between w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === "requests" 
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs" 
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock size={18} className="shrink-0" />
                      <span className="truncate">Pending Requests</span>
                    </div>
                    {requests.length > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-xs shrink-0">
                        {requests.length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => setActiveTab("connections")}
                    className={`flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === "connections" 
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs" 
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <UserCheck size={18} className="shrink-0" />
                    <span>My Connections</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-2 min-[340px]:p-4 sm:p-6 transition-colors min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{getTabTitle()}</h2>
            
            {loading ? (
              <NetworkCardSkeleton type={activeTab} />
            ) : (
              <>
                {activeTab === "suggestions" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suggestions.map((profile) => (
                      <BorderGlow key={profile._id} borderRadius={12} className="hover-lift flex flex-col h-full">
                        <div className={`h-16 relative rounded-t-[inherit] bg-gradient-to-r ${profile.user?.role === 'recruiter' ? 'from-amber-400 to-orange-500' : profile.user?.role === 'mentor' ? 'from-emerald-400 to-teal-500' : 'from-indigo-500 to-purple-600'}`}>
                          {(profile.user?.role === 'recruiter' || profile.user?.role === 'mentor') && (
                            <span className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                              {profile.user?.role}
                            </span>
                          )}
                        </div>
                        <div className="px-2 pb-4 min-[340px]:px-4 flex-1 flex flex-col items-center text-center -mt-8 relative z-10">
                          <img src={profile.user?.profileImage || "https://via.placeholder.com/150"} alt="" className="w-16 h-16 rounded-full border-4 border-white dark:border-slate-800 bg-gray-200 dark:bg-slate-700 object-cover" />
                          <h3 className="font-bold text-gray-900 dark:text-white mt-2">{profile.user?.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{profile.headline || profile.user?.role}</p>
                          <div className="mt-auto pt-4 w-full">
                            <Link to={`/profile/${profile.user?._id}`} className="block w-full py-1.5 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-600 dark:border-indigo-500 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition text-xs min-[340px]:text-sm">
                              View Profile
                            </Link>
                          </div>
                        </div>
                      </BorderGlow>
                    ))}
                    {suggestions.length === 0 && <p className="text-gray-500 col-span-full">No suggestions available right now.</p>}
                  </div>
                )}

                {activeTab === "requests" && (
                  <div className="space-y-4">
                    {requests.map((req) => (
                      <div key={req._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 sm:p-4 border border-gray-200 dark:border-slate-700 rounded-xl hover-scale-sm bg-white dark:bg-slate-800/40 hover:bg-gray-50/80 dark:hover:bg-slate-800/85 transition-all duration-300">
                        <div className="flex items-center space-x-4 min-w-0">
                          <img src={req.requester?.profileImage || "https://via.placeholder.com/150"} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                          <div className="min-w-0">
                            <Link to={`/profile/${req.requester?._id}`} className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition truncate block">
                              {req.requester?.name}
                            </Link>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{req.requester?.headline}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2 self-end sm:self-auto shrink-0">
                          <button onClick={() => handleAccept(req._id)} disabled={processingIds.has(req._id)} className="p-2 text-green-600 hover:bg-green-50 rounded-full transition border border-green-200 disabled:opacity-50" title="Accept">
                            {processingIds.has(req._id) ? <div className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full" /> : <Check size={20} />}
                          </button>
                          <button onClick={() => handleReject(req._id)} disabled={processingIds.has(req._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition border border-red-200 disabled:opacity-50" title="Reject">
                            {processingIds.has(req._id) ? <div className="animate-spin h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full" /> : <X size={20} />}
                          </button>
                        </div>
                      </div>
                    ))}
                    {requests.length === 0 && <p className="text-gray-500">You have no pending requests.</p>}
                  </div>
                )}

                {activeTab === "connections" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {connections.map((conn) => {
                      const otherUser = conn.requester._id === user?._id ? conn.recipient : conn.requester;
                      return (
                        <div key={conn._id} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-200 dark:border-slate-700 rounded-xl min-w-0 hover-scale-sm bg-white dark:bg-slate-800/40 hover:bg-gray-50/80 dark:hover:bg-slate-800/85 transition-all duration-300">
                          <img src={otherUser.profileImage || "https://via.placeholder.com/150"} alt="" className="w-12 h-12 rounded-full object-cover" />
                          <div className="flex-1 min-w-0">
                            <Link to={`/profile/${otherUser._id}`} className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition truncate block">
                              {otherUser.name}
                            </Link>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{otherUser.headline}</p>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            <button onClick={() => handleStartChat(otherUser._id)} disabled={startingChatIds.has(otherUser._id)} className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-full transition disabled:opacity-50" title="Message">
                              {startingChatIds.has(otherUser._id) ? <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" /> : <MessageSquare size={18} />}
                            </button>
                            <button 
                              onClick={() => handleDisconnectClick(otherUser._id)} 
                              disabled={disconnectingIds.has(otherUser._id)} 
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center disabled:opacity-50 ${
                                confirmDisconnectId === otherUser._id 
                                  ? "bg-red-600 text-white font-bold animate-pulse shadow-sm shadow-red-500/20" 
                                  : "text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                              }`}
                              title="Disconnect"
                            >
                              {disconnectingIds.has(otherUser._id) ? (
                                <div className="animate-spin h-3.5 w-3.5 border-2 border-red-600 border-t-transparent rounded-full" />
                              ) : confirmDisconnectId === otherUser._id ? (
                                "Confirm?"
                              ) : (
                                "Disconnect"
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {connections.length === 0 && <p className="text-gray-500 col-span-full">You don't have any connections yet.</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
