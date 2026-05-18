import React, { useState, useEffect } from "react";
import { Plus, Users, Search, UsersRound, Loader2 } from "lucide-react";
import io, { Socket } from "socket.io-client";
import axiosInstance from "../utils/axios";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Real-time socket
  const [socket, setSocket] = useState<Socket | null>(null);

  const [exploreGroups, setExploreGroups] = useState<any[]>([]);

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      const res = await axiosInstance.get("/api/groups");
      const allGroups = res.data;
      const joinedGroups = allGroups.filter((g: any) => g.members?.some((m: any) => m._id === user?._id || m === user?._id));
      setGroups(joinedGroups);
      
      try {
        const recRes = await axiosInstance.get("/api/recommendations/groups");
        if (recRes.data && recRes.data.length > 0) {
          setExploreGroups(recRes.data);
        } else {
          setExploreGroups(allGroups.filter((g: any) => !g.members?.some((m: any) => m._id === user?._id || m === user?._id)));
        }
      } catch (err) {
        setExploreGroups(allGroups.filter((g: any) => !g.members?.some((m: any) => m._id === user?._id || m === user?._id)));
      }
      
      // Initialize Socket connection
      if (user) {
        const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");
        newSocket.emit("setup", user);
        
        // Join all joined groups
        joinedGroups.forEach((g: any) => {
          newSocket.emit("join group", g._id);
        });

        newSocket.on("group message received", (newMsg) => {
          setGroups(prevGroups => prevGroups.map(g => {
            if (g._id === newMsg.group._id || g._id === newMsg.group) {
              return { ...g, unreadCount: (g.unreadCount || 0) + 1 };
            }
            return g;
          }));
        });

        newSocket.on("new group discussion", (newPost) => {
          setGroups(prevGroups => prevGroups.map(g => {
            if (g._id === newPost.group._id || g._id === newPost.group) {
              return { ...g, unreadCount: (g.unreadCount || 0) + 1 };
            }
            return g;
          }));
        });

        setSocket(newSocket);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await axiosInstance.post("/api/groups", { name, description, visibility });
      setGroups([...groups, res.data]);
      setShowCreateModal(false);
      setName("");
      setDescription("");
      setVisibility("public");
      navigate(`/groups/${res.data._id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-8 pb-12 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Professional Groups</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Connect with like-minded professionals in specialized communities.</p>
          </div>
          {user?.role !== "admin" && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition flex items-center shadow-sm"
            >
              <Plus size={20} className="mr-2" /> Create Group
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* My Groups Section */}
            {groups.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex flex-wrap items-center gap-2">
                  <div className="flex items-center"><Users size={20} className="mr-2 text-indigo-600 dark:text-indigo-400" /> My Groups</div>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group) => (
                    <div key={group._id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/50 overflow-hidden hover:shadow-md transition flex flex-col relative ring-1 ring-indigo-50 dark:ring-0 min-w-0">
                      <div className="absolute top-4 right-4 z-10">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm ${
                          group.visibility === 'private' 
                            ? 'bg-gray-900 text-white border border-gray-700' 
                            : 'bg-white text-indigo-600 border border-indigo-100'
                        }`}>
                          {group.visibility === 'private' ? 'Private' : 'Public'}
                        </span>
                      </div>
                      <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                        <UsersRound size={40} className="text-white opacity-80" />
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <Link to={`/groups/${group._id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-start justify-between gap-2 min-w-0">
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1 min-w-0 break-all">{group.name}</h2>
                          {group.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                              {group.unreadCount} new
                            </span>
                          )}
                        </Link>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2 flex-1">{group.description}</p>
                        
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                            <Users size={16} className="mr-1.5" />
                            {group.members?.length || 0} members
                          </div>
                          <Link to={`/groups/${group._id}`} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm transition">
                            View Group
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explore Groups Section */}
            {exploreGroups.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex flex-wrap items-center gap-2">
                  <div className="flex items-center"><Search size={20} className="mr-2 text-gray-400" /> Explore Groups</div>
                  <span className="px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-full font-medium shrink-0">AI Suggested</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exploreGroups.map((group) => (
                    <div key={group._id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition flex flex-col relative min-w-0">
                      <div className="absolute top-4 right-4 z-10">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm ${
                          group.visibility === 'private' 
                            ? 'bg-gray-900 text-white border border-gray-700' 
                            : 'bg-white text-gray-600 dark:bg-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600'
                        }`}>
                          {group.visibility === 'private' ? 'Private' : 'Public'}
                        </span>
                      </div>
                      <div className="h-24 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                        <UsersRound size={40} className="text-gray-400" />
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <Link to={`/groups/${group._id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors min-w-0">
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1 break-all">{group.name}</h2>
                        </Link>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2 flex-1">{group.description}</p>
                        
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                            <Users size={16} className="mr-1.5" />
                            {group.members?.length || 0} members
                          </div>
                          <Link to={`/groups/${group._id}`} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-sm transition">
                            View Group
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {groups.length === 0 && exploreGroups.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 border-dashed transition-colors">
                <UsersRound size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No groups found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Be the first to create a professional group!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transition-colors">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create a New Group</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
                  <input type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="e.g. React Developers India"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none resize-none placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="What is this group about?"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
                  <select value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none"
                  >
                    <option value="public">Public (Anyone can join)</option>
                    <option value="private">Private (Invite only)</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center min-w-[140px]"
                >
                  {creating && <Loader2 size={16} className="animate-spin mr-2" />}
                  {creating ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
