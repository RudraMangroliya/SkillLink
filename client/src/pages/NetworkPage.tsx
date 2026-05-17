import React, { useState, useEffect } from "react";
import { Users, UserPlus, Check, X, MessageSquare } from "lucide-react";
import axiosInstance from "../utils/axios";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<"connections" | "requests" | "suggestions">("suggestions");
  const [connections, setConnections] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const handleStartChat = async (userId: string) => {
    try {
      await axiosInstance.post("/api/chats", { userId });
      navigate("/chat");
    } catch (err) {
      console.error(err);
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
    try {
      await axiosInstance.post(`/api/connections/accept/${id}`);
      setRequests(requests.filter(r => r._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await axiosInstance.post(`/api/connections/reject/${id}`);
      setRequests(requests.filter(r => r._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-4 sm:pt-8 pb-12 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden shrink-0 h-max transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 font-semibold text-gray-800 dark:text-white transition-colors">
              Manage My Network
            </div>
            <div className="flex flex-col py-2">
              <button 
                onClick={() => setActiveTab("suggestions")}
                className={`text-left px-4 py-3 text-sm font-medium transition ${activeTab === "suggestions" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600 dark:border-indigo-500" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white border-l-4 border-transparent"}`}
              >
                Suggested People
              </button>
              {user?.role !== "admin" && (
                <>
                  <button 
                    onClick={() => setActiveTab("requests")}
                    className={`flex flex-wrap gap-2 justify-between items-center text-left px-4 py-3 text-sm font-medium transition ${activeTab === "requests" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600 dark:border-indigo-500" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white border-l-4 border-transparent"}`}
                  >
                    <span>Pending Requests</span>
                    {requests.length > 0 && activeTab !== "requests" && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{requests.length}</span>
                    )}
                  </button>
                  <button 
                    onClick={() => setActiveTab("connections")}
                    className={`text-left px-4 py-3 text-sm font-medium transition ${activeTab === "connections" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600 dark:border-indigo-500" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white border-l-4 border-transparent"}`}
                  >
                    My Connections
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-3 sm:p-6 transition-colors min-w-0">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {activeTab === "suggestions" && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Suggested for you</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {suggestions.map((profile) => (
                        <div key={profile._id} className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition bg-white dark:bg-slate-800 flex flex-col">
                          <div className={`h-16 relative bg-gradient-to-r ${profile.user?.role === 'recruiter' ? 'from-amber-400 to-orange-500' : profile.user?.role === 'mentor' ? 'from-emerald-400 to-teal-500' : 'from-indigo-500 to-purple-600'}`}>
                            {(profile.user?.role === 'recruiter' || profile.user?.role === 'mentor') && (
                              <span className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                                {profile.user?.role}
                              </span>
                            )}
                          </div>
                          <div className="px-4 pb-4 flex-1 flex flex-col items-center text-center -mt-8 relative z-10">
                            <img src={profile.user?.profileImage || "https://via.placeholder.com/150"} alt="" className="w-16 h-16 rounded-full border-4 border-white dark:border-slate-800 bg-gray-200 dark:bg-slate-700 object-cover" />
                            <h3 className="font-bold text-gray-900 dark:text-white mt-2">{profile.user?.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{profile.headline || profile.user?.role}</p>
                            <div className="mt-auto pt-4 w-full">
                              <Link to={`/profile/${profile.user?._id}`} className="block w-full py-1.5 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-600 dark:border-indigo-500 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition text-sm">
                                View Profile
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                      {suggestions.length === 0 && <p className="text-gray-500 col-span-full">No suggestions available right now.</p>}
                    </div>
                  </div>
                )}

                {activeTab === "requests" && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Pending Requests</h2>
                    <div className="space-y-4">
                      {requests.map((req) => (
                        <div key={req._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 sm:p-4 border border-gray-200 dark:border-slate-700 rounded-xl">
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
                            <button onClick={() => handleAccept(req._id)} className="p-2 text-green-600 hover:bg-green-50 rounded-full transition border border-green-200" title="Accept">
                              <Check size={20} />
                            </button>
                            <button onClick={() => handleReject(req._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition border border-red-200" title="Reject">
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {requests.length === 0 && <p className="text-gray-500">You have no pending requests.</p>}
                    </div>
                  </div>
                )}

                {activeTab === "connections" && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">My Connections</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {connections.map((conn) => {
                        // determine if the current user is requester or recipient
                        const otherUser = conn.requester._id === user?._id ? conn.recipient : conn.requester;
                        return (
                          <div key={conn._id} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-200 dark:border-slate-700 rounded-xl min-w-0">
                            <img src={otherUser.profileImage || "https://via.placeholder.com/150"} alt="" className="w-12 h-12 rounded-full object-cover" />
                            <div className="flex-1 min-w-0">
                              <Link to={`/profile/${otherUser._id}`} className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition truncate block">
                                {otherUser.name}
                              </Link>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{otherUser.headline}</p>
                            </div>
                            <button onClick={() => handleStartChat(otherUser._id)} className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-full transition">
                              <MessageSquare size={18} />
                            </button>
                          </div>
                        );
                      })}
                      {connections.length === 0 && <p className="text-gray-500 col-span-full">You don't have any connections yet.</p>}
                    </div>
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
