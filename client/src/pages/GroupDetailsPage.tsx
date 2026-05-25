import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { UsersRound, Users, Plus, MessageSquare, Send, ArrowLeft, Settings, MessageCircle, Info, Smile, Edit2, Trash2, MoreVertical, Sparkles, Loader2 } from "lucide-react";
import PageLoader from "../components/PageLoader";
import axiosInstance from "../utils/axios";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import io, { Socket } from "socket.io-client";

let socket: Socket;

// Programmatic, high-quality audio chimes for premium user alerts
const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Tone 1: Fundamental sweet chime (C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.45, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Tone 2: Perfect fifth harmony (G5), rising beautifully
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(783.99, now + 0.08);
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.6, now + 0.095);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.4);
  } catch (error) {
    console.warn("Failed to play notification chime:", error);
  }
};

const playSubtlePop = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    
    // Quick pop starting at 500Hz sliding down to 300Hz in 60ms
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch (error) {
    console.warn("Failed to play subtle bubble pop:", error);
  }
};

export default function GroupDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [group, setGroup] = useState<any>(null);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<"Posts" | "Chat" | "Members" | "Settings">("Posts");
  
  // Discussion State
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [postingDiscussion, setPostingDiscussion] = useState(false);
  const [updatingGroup, setUpdatingGroup] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [addingMemberIds, setAddingMemberIds] = useState<Set<string>>(new Set());
  const [removingMemberIds, setRemovingMemberIds] = useState<Set<string>>(new Set());
  const [deletingDiscussionId, setDeletingDiscussionId] = useState<string | null>(null);
  const [postingCommentId, setPostingCommentId] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [savingEditedMessage, setSavingEditedMessage] = useState(false);
  const [reactingMessageId, setReactingMessageId] = useState<string | null>(null);
  
  // Realtime Features State
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0); // Chat unread
  const [unreadPostsCount, setUnreadPostsCount] = useState(0);
  
  // Advanced Chat State
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState("");
  
  // Smart Reply AI State
  const [smartReplies, setSmartReplies] = useState<string[]>([]);

  // Settings State
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editTags, setEditTags] = useState("");
  const [editRules, setEditRules] = useState("");
  const [editVisibility, setEditVisibility] = useState("public");

  // Add Member State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  useEffect(() => {
    fetchGroupData();
  }, [id]);

  const isMember = group?.members?.some((m: any) => m._id === user?._id) || false;
  const isAdmin = group?.admin?._id === user?._id || false;

  useEffect(() => {
    if (activeTab === "Chat" && group && isMember) {
      fetchMessages();
      setUnreadCount(0);
    }
  }, [activeTab, group, isMember]);

  useEffect(() => {
    if (group && isMember) {
      socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
        transports: ["websocket"],
      });
      socket.emit("setup", user);
      socket.on("connected", () => setSocketConnected(true));
      socket.emit("join group", id);

      socket.on("group typing", (room) => {
        if (room === id) setIsTyping(true);
      });
      socket.on("stop group typing", (room) => {
        if (room === id) setIsTyping(false);
      });

      socket.on("online users", (users) => setOnlineUsers(users));
      socket.on("user online", (userId) => setOnlineUsers(prev => [...prev, userId]));
      socket.on("user offline", (userId) => setOnlineUsers(prev => prev.filter(uid => uid !== userId)));

      return () => {
        socket.emit("leave group", id);
        socket.disconnect();
      };
    }
  }, [group, isMember]);

  useEffect(() => {
    if (socket) {
      socket.on("group message received", (newMessageReceived) => {
        if (id === newMessageReceived.group._id || id === newMessageReceived.group) {
          setMessages((prev) => [...prev, newMessageReceived]);
          if (activeTab === "Chat") {
            axiosInstance.put(`/api/groups/${id}/read-messages`).catch(console.error);
            playSubtlePop();
          } else {
            setUnreadCount((prev) => prev + 1);
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`New message in ${group?.name}`, {
                body: `${newMessageReceived.sender.name}: ${newMessageReceived.content}`
              });
            }
            playNotificationChime();
          }
        }
      });

      socket.on("group message updated", (updatedMsg) => {
        if (updatedMsg.group._id !== id) return;
        setMessages((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
      });

      socket.on("group message deleted", (deletedMsg) => {
        if (deletedMsg.group._id !== id && deletedMsg.group !== id) return;
        setMessages((prev) => prev.map(m => m._id === deletedMsg._id ? deletedMsg : m));
      });

      socket.on("new group discussion", (newPost) => {
        const postGroupId = newPost.group._id || newPost.group;
        if (postGroupId !== id) return;
        
        // Handle notification if not on Posts tab
        if (activeTab !== "Posts") {
          setUnreadPostsCount(prev => prev + 1);
        } else {
          // If on Posts tab, we could fetch or append, but for now we just show it if they refresh
          // or we can append it directly!
          setDiscussions(prev => [newPost, ...prev]);
        }
      });
    }
    return () => {
      if (socket) {
        socket.off("group message received");
        socket.off("group message updated");
        socket.off("group message deleted");
        socket.off("new group discussion");
      }
    };
  });

  // Request Notification Permission on Mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (activeTab === "Chat") {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  }, [messages, activeTab]);

  useEffect(() => {
    if (activeTab === "Chat" && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender?._id !== user?._id && !lastMessage.isDeleted) {
        // Grab the last 3 messages for better context
        const recentMessages = messages.slice(-3).map((m: any) => m.content).join(" | ");
        axiosInstance.post("/api/recommendations/smart-reply", { message: recentMessages })
          .then(res => setSmartReplies(res.data.suggestions || []))
          .catch(err => console.error("Failed to fetch smart replies", err));
      } else {
        setSmartReplies([]);
      }
    } else {
      setSmartReplies([]);
    }
  }, [messages, user, activeTab]);

  const fetchGroupData = async () => {
    setLoading(true);
    try {
      const groupRes = await axiosInstance.get(`/api/groups/${id}`);
      setGroup(groupRes.data);
      if (groupRes.data.unreadPostsCount !== undefined) {
        setUnreadPostsCount(activeTab === "Posts" ? 0 : groupRes.data.unreadPostsCount);
      }
      if (groupRes.data.unreadMessagesCount !== undefined) {
        setUnreadCount(activeTab === "Chat" ? 0 : groupRes.data.unreadMessagesCount);
      }
      setEditName(groupRes.data.name);
      setEditDesc(groupRes.data.description);
      setEditCategory(groupRes.data.category || "General");
      setEditTags(groupRes.data.tags?.join(", ") || "");
      setEditRules(groupRes.data.rules?.join("\n") || "");
      setEditVisibility(groupRes.data.visibility || "public");
      
      const discRes = await axiosInstance.get(`/api/groups/${id}/discussions`);
      setDiscussions(discRes.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setErrorMsg("This group is private.");
      } else {
        setErrorMsg("Group not found.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await axiosInstance.get(`/api/groups/${id}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      await axiosInstance.post(`/api/groups/${id}/join`);
      fetchGroupData();
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    setJoining(true);
    try {
      await axiosInstance.post(`/api/groups/${id}/leave`);
      navigate("/groups");
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  const handlePostDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostingDiscussion(true);
    try {
      const res = await axiosInstance.post(`/api/groups/${id}/discussions`, { title: newTitle, content: newContent });
      setDiscussions([res.data, ...discussions]);
      setNewTitle("");
      setNewContent("");
      setShowNewDiscussion(false);
      socket.emit("new group discussion", res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setPostingDiscussion(false);
    }
  };

  const handleDeleteDiscussion = async (discussionId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setDeletingDiscussionId(discussionId);
    try {
      await axiosInstance.delete(`/api/groups/discussions/${discussionId}`);
      setDiscussions(discussions.filter(d => d._id !== discussionId));
    } catch (err) {
      console.error("Failed to delete discussion:", err);
    } finally {
      setDeletingDiscussionId(null);
    }
  };

  const handlePostComment = async (discussionId: string) => {
    if (!commentText[discussionId]?.trim()) return;
    setPostingCommentId(discussionId);
    try {
      const res = await axiosInstance.post(`/api/groups/discussions/${discussionId}/comments`, { text: commentText[discussionId] });
      setDiscussions(discussions.map(d => d._id === discussionId ? res.data : d));
      setCommentText({ ...commentText, [discussionId]: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setPostingCommentId(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isMember || isSendingMessage) return;
    
    setIsSendingMessage(true);
    socket.emit("stop group typing", id);
    try {
      const res = await axiosInstance.post(`/api/groups/${id}/messages`, { content: newMessage });
      socket.emit("new group message", res.data);
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message", err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const typingHandler = (e: any) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("group typing", id);
    }
    let lastTypingTime = new Date().getTime();
    setTimeout(() => {
      let timeNow = new Date().getTime();
      if (timeNow - lastTypingTime >= 3000 && typing) {
        socket.emit("stop group typing", id);
        setTyping(false);
      }
    }, 3000);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    setDeletingMessageId(messageId);
    try {
      const res = await axiosInstance.delete(`/api/groups/${id}/messages/${messageId}`);
      setMessages(messages.map(m => m._id === messageId ? res.data : m));
      socket.emit("group message deleted", res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleEditMessage = async (e: React.FormEvent, messageId: string) => {
    e.preventDefault();
    setSavingEditedMessage(true);
    try {
      const res = await axiosInstance.put(`/api/groups/${id}/messages/${messageId}`, { content: editMessageText });
      setMessages(messages.map(m => m._id === messageId ? res.data : m));
      socket.emit("group message updated", res.data);
      setEditingMessage(null);
      setEditMessageText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEditedMessage(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    setReactingMessageId(messageId);
    try {
      const res = await axiosInstance.post(`/api/groups/${id}/messages/${messageId}/react`, { emoji });
      setMessages(messages.map(m => m._id === messageId ? res.data : m));
      socket.emit("group message updated", res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setReactingMessageId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm("Remove this member?")) return;
    setRemovingMemberIds(prev => new Set(prev).add(memberId));
    try {
      await axiosInstance.delete(`/api/groups/${id}/members/${memberId}`);
      fetchGroupData();
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingMemberIds(prev => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingGroup(true);
    try {
      const rulesArray = editRules.split("\n").filter(r => r.trim());
      const tagsArray = editTags.split(",").map(t => t.trim()).filter(t => t);

      await axiosInstance.put(`/api/groups/${id}`, { 
        name: editName, 
        description: editDesc, 
        category: editCategory,
        tags: tagsArray,
        rules: rulesArray,
        visibility: editVisibility
      });
      fetchGroupData();
      alert("Group updated successfully");
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleSearchUser = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const res = await axiosInstance.get(`/api/profile/search?keyword=${query}`);
      // Profiles are returned, we need to map to user objects
      const users = res.data.map((p: any) => p.user).filter((u: any) => u && !group.members.some((m: any) => m._id === u._id));
      setSearchResults(users);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    setAddingMemberIds(prev => new Set(prev).add(userId));
    try {
      await axiosInstance.post(`/api/groups/${id}/members`, { userId });
      fetchGroupData();
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error(err);
      alert("Failed to add member");
    } finally {
      setAddingMemberIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this group?")) return;
    setDeletingGroup(true);
    try {
      await axiosInstance.delete(`/api/groups/${id}`);
      navigate("/groups");
    } catch (err) {
      console.error(err);
      setDeletingGroup(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading group details..." />;
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-32">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{errorMsg || "Group not found"}</h2>
        <Link to="/groups" className="text-indigo-600 hover:underline">Return to Groups</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-4 sm:pt-8 pb-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-1 sm:px-6 lg:px-8">
        <Link to="/groups" className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition">
          <ArrowLeft size={16} className="mr-1" /> Back to Groups
        </Link>
        
        {/* Group Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-8 transition-colors">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="px-2 sm:px-8 pb-4 sm:pb-6 relative">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-md flex items-center justify-center -mt-10 mb-4 border border-gray-100 dark:border-slate-700 transition-colors">
              <UsersRound size={40} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white break-words">{group.name}</h1>
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-2">
                  <Users size={16} className="mr-1.5" />
                  {group.members.length} member{group.members.length !== 1 && 's'}
                </div>
              </div>
              <div className="shrink-0 w-full sm:w-auto">
                {isAdmin ? (
                   <span className="inline-flex items-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg font-medium border border-indigo-100 dark:border-indigo-800/50 w-full justify-center">
                     Admin Dashboard
                   </span>
                ) : isMember ? (
                  <button 
                    onClick={handleLeave}
                    disabled={joining}
                    className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-sm hover:shadow disabled:opacity-50 flex items-center justify-center min-w-[140px]"
                  >
                    {joining && <Loader2 size={18} className="animate-spin mr-2" />}
                    {joining ? "Leaving..." : "Leave Group"}
                  </button>
                ) : user?.role !== "admin" ? (
                  <button 
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center disabled:opacity-50 min-w-[140px]"
                  >
                    {joining ? <Loader2 size={18} className="animate-spin mr-2" /> : <Plus size={18} className="mr-2" />}
                    {joining ? "Joining..." : "Join Group"}
                  </button>
                ) : null}
              </div>
            </div>
            <p className="mt-6 text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl border border-gray-100 dark:border-slate-700 break-words">
              {group.description}
            </p>
          </div>
          
          {/* Tabs Navigation */}
          <div className="border-t border-gray-100 dark:border-slate-700 px-2 sm:px-8 flex space-x-4 sm:space-x-6 overflow-x-auto no-scrollbar">
            <button 
              className={`py-4 font-medium text-sm border-b-2 transition-colors relative whitespace-nowrap ${activeTab === "Posts" ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
              onClick={() => { setActiveTab("Posts"); setUnreadPostsCount(0); }}
            >
              <div className="flex items-center"><MessageSquare size={16} className="mr-2" /> Posts</div>
              {unreadPostsCount > 0 && (
                <span className="absolute top-1 -right-4 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {unreadPostsCount}
                </span>
              )}
            </button>
            <button onClick={() => { setActiveTab("Chat"); setUnreadCount(0); }} className={`pb-3 pt-4 font-medium text-sm transition relative whitespace-nowrap ${activeTab === "Chat" ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>
              <span className="flex items-center"><MessageCircle size={16} className="mr-2" /> Live Chat</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 -right-4 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>
            <button 
              className={`py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === "Members" ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
              onClick={() => setActiveTab("Members")}
            >
              <div className="flex items-center"><Users size={16} className="mr-2" /> Members</div>
            </button>
            {isAdmin && (
              <button 
                className={`py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === "Settings" ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                onClick={() => setActiveTab("Settings")}
              >
                <div className="flex items-center"><Settings size={16} className="mr-2" /> Settings</div>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          
          {/* POSTS TAB */}
          {activeTab === "Posts" && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden p-3 sm:p-6 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Posts & Discussions</h2>
                {isMember && (
                  <button 
                    onClick={() => setShowNewDiscussion(!showNewDiscussion)}
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-lg shadow-sm hover:shadow"
                  >
                    {showNewDiscussion ? "Cancel" : "Start a Post"}
                  </button>
                )}
              </div>

              {!isMember && (
                <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 border-dashed rounded-xl p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Join this group to view and participate in discussions.</p>
                </div>
              )}

              {isMember && showNewDiscussion && (
                <form onSubmit={handlePostDiscussion} className="mb-8 p-2 sm:p-5 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl transition-colors">
                  <input type="text" id="postTitle" name="postTitle" placeholder="Post Title" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-3 py-2 mb-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-medium placeholder-gray-400 dark:placeholder-gray-500" />
                  <textarea id="postContent" name="postContent" placeholder="What do you want to share?" required rows={4} value={newContent} onChange={(e) => setNewContent(e.target.value)} className="w-full px-4 py-2 mb-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none resize-none text-sm placeholder-gray-400 dark:placeholder-gray-500"></textarea>
                  <div className="flex justify-end">
                    <button type="submit" disabled={postingDiscussion} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition text-sm disabled:opacity-50 flex items-center min-w-[100px] justify-center">
                      {postingDiscussion ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                      {postingDiscussion ? "Posting..." : "Post"}
                    </button>
                  </div>
                </form>
              )}

              {isMember && (
                <div className="space-y-6">
                  {discussions.map((disc) => (
                    <div key={disc._id} className="border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl p-2 sm:p-5 shadow-sm hover:shadow-md transition min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3 min-w-0 pr-2">
                          <img src={disc.author.profileImage || "https://via.placeholder.com/150"} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-600 shrink-0" />
                          <div className="min-w-0">
                            <Link to={`/profile/${disc.author._id}`} className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition text-sm truncate block">{disc.author.name}</Link>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{new Date(disc.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {(disc.author._id === user?._id || isAdmin) && (
                          <button 
                            onClick={() => handleDeleteDiscussion(disc._id)}
                            disabled={deletingDiscussionId === disc._id}
                            className="text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                            title="Delete Post"
                          >
                            {deletingDiscussionId === disc._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 break-words">{disc.title}</h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed break-words">{disc.content}</p>
                      
                      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">{disc.comments.length} Comments</h4>
                        <div className="space-y-4 mb-4">
                          {disc.comments.map((comment: any, idx: number) => (
                            <div key={idx} className="flex space-x-2 sm:space-x-3 bg-gray-50 dark:bg-slate-700/50 p-2 sm:p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                              <img src={comment.author.profileImage || "https://via.placeholder.com/150"} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-baseline gap-x-2">
                                  <Link to={`/profile/${comment.author._id}`} className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-sm break-words">{comment.author.name}</Link>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 text-sm mt-1 break-words">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <input type="text" id={`comment-${disc._id}`} name={`comment-${disc._id}`} placeholder="Add a comment..." value={commentText[disc._id] || ""} onChange={(e) => setCommentText({...commentText, [disc._id]: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handlePostComment(disc._id)} className="flex-1 px-3 sm:px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full focus:bg-white dark:focus:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none text-sm min-w-0 placeholder-gray-400 dark:placeholder-gray-400" />
                          <button onClick={() => handlePostComment(disc._id)} disabled={!commentText[disc._id]?.trim() || postingCommentId === disc._id} className="p-2.5 shrink-0 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center">
                            {postingCommentId === disc._id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {discussions.length === 0 && (
                    <div className="text-center py-10 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 border-dashed">
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No posts yet. Start the conversation!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === "Chat" && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden h-[600px] flex flex-col transition-colors">
              {!isMember ? (
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors">
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Join the group to access live chat.</p>
                </div>
              ) : (
                <>
                  <div ref={messagesContainerRef} className="flex-1 min-h-0 p-2 sm:p-6 overflow-y-auto bg-gray-50 dark:bg-slate-900 flex flex-col space-y-4 transition-colors">
                    {messages.map((msg, i) => {
                      const isMe = msg.sender._id === user?._id;
                      return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`} onMouseEnter={() => setHoveredMessage(msg._id)} onMouseLeave={() => setHoveredMessage(null)}>
                          <div className={`max-w-[85%] sm:max-w-[70%] flex items-end space-x-2 relative ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                            {!isMe && <img src={msg.sender.profileImage || `https://ui-avatars.com/api/?name=${msg.sender.name}&background=random`} alt="" className="w-8 h-8 rounded-full mb-1" />}
                            
                            <div className={`p-3 rounded-2xl relative shadow-sm border ${isMe ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-gray-900 dark:text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-bl-none'} ${msg.isDeleted ? 'opacity-70 italic' : ''}`}>
                              {!isMe && <p className="text-xs font-semibold mb-1 text-indigo-600 dark:text-indigo-400">{msg.sender.name}</p>}
                              
                              {editingMessage === msg._id ? (
                                <form onSubmit={(e) => handleEditMessage(e, msg._id)} className="flex items-center space-x-2">
                                  <input type="text" id={`editMessage-${msg._id}`} name={`editMessage-${msg._id}`} value={editMessageText} onChange={(e) => setEditMessageText(e.target.value)} className="px-2 py-1 text-gray-900 dark:text-white bg-white dark:bg-slate-700 rounded border border-gray-300 dark:border-slate-600 text-sm focus:outline-none" autoFocus />
                                  <button type="submit" disabled={savingEditedMessage} className={`text-xs px-2 py-1 rounded ${isMe ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'} disabled:opacity-50`}>{savingEditedMessage ? 'Saving...' : 'Save'}</button>
                                  <button type="button" onClick={() => setEditingMessage(null)} disabled={savingEditedMessage} className="text-xs opacity-75 disabled:opacity-50">Cancel</button>
                                </form>
                              ) : (
                                <p className="text-sm leading-relaxed">
                                  {msg.isDeleted ? "🚫 This message was deleted" : msg.content}
                                </p>
                              )}

                              <div className="flex items-center justify-between mt-1 min-w-[80px]">
                                <div className="flex space-x-1">
                                  {msg.reactions && msg.reactions.map((r: any, idx: number) => (
                                    <span key={idx} className="text-xs bg-black/10 rounded px-1">{r.emoji}</span>
                                  ))}
                                </div>
                                <div className="flex items-center space-x-1 ml-3">
                                  {msg.isEdited && !msg.isDeleted && <span className={`text-[9px] ${isMe ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400'}`}>(edited)</span>}
                                  <p className={`text-[10px] ${isMe ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>

                              {/* Hover Actions (Below Message) */}
                              {hoveredMessage === msg._id && !msg.isDeleted && (
                                <div className={`flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 shadow-sm rounded-lg px-2 py-1.5 mt-2 space-x-3 w-max ${isMe ? 'ml-auto' : 'mr-auto'} text-gray-700 dark:text-gray-300 transition-colors`}>
                                  <button onClick={() => handleReaction(msg._id, "👍")} disabled={reactingMessageId === msg._id} className="hover:scale-125 transition disabled:opacity-50">👍</button>
                                  <button onClick={() => handleReaction(msg._id, "❤️")} disabled={reactingMessageId === msg._id} className="hover:scale-125 transition disabled:opacity-50">❤️</button>
                                  <button onClick={() => handleReaction(msg._id, "😂")} disabled={reactingMessageId === msg._id} className="hover:scale-125 transition disabled:opacity-50">😂</button>
                                  {isMe && (
                                    <>
                                      <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1"></div>
                                      <button onClick={() => { setEditingMessage(msg._id); setEditMessageText(msg.content); }} className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Edit2 size={14} /></button>
                                      <button onClick={() => handleDeleteMessage(msg._id)} disabled={deletingMessageId === msg._id} className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50">
                                        {deletingMessageId === msg._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 p-3 rounded-2xl rounded-bl-none shadow-sm text-sm italic transition-colors">
                          Someone is typing...
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-2 sm:p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 transition-colors shrink-0">
                    {smartReplies.length > 0 && newMessage.length === 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                        <div className="flex items-center text-indigo-500 text-xs font-medium mr-1 shrink-0">
                          <Sparkles size={14} className="mr-1" /> AI Suggests:
                        </div>
                        {smartReplies.map((reply, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setNewMessage(reply);
                              setSmartReplies([]);
                            }}
                            className="shrink-0 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-medium px-3 py-1.5 rounded-full transition-colors border border-indigo-100 dark:border-indigo-800/50"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex space-x-2 sm:space-x-3 mt-2 sm:mt-0">
                      <input 
                        type="text" 
                        id="chatInput"
                        name="chatInput"
                        placeholder="Message the group..." 
                        value={newMessage}
                        onChange={typingHandler}
                        className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-600 rounded-full focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none text-xs sm:text-sm placeholder-gray-400 dark:placeholder-gray-400"
                      />
                      <button 
                        type="submit" 
                        disabled={!newMessage.trim() || isSendingMessage}
                        className="p-2 sm:p-3 shrink-0 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center"
                      >
                        {isSendingMessage ? <Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" /> : <Send size={16} className="sm:w-[18px] sm:h-[18px]" />}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === "Members" && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
              <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Members Directory</h2>
              </div>
              
              {isAdmin && (
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-indigo-50/50 dark:bg-slate-700/30">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Add New Member</h3>
                  <div className="relative">
                    <input 
                      type="text" 
                      id="memberSearch"
                      name="memberSearch"
                      placeholder="Search for users by name..."
                      value={searchQuery}
                      onChange={handleSearchUser}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    {searchingUsers && <div className="absolute right-3 top-2.5 text-xs text-gray-500 dark:text-gray-400">Searching...</div>}
                    
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((u) => (
                          <div key={u._id} className="flex flex-col min-[350px]:flex-row min-[350px]:items-center justify-between gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-100 dark:border-slate-700">
                            <div className="flex items-center space-x-3 min-w-0">
                              <img src={u.profileImage || `https://ui-avatars.com/api/?name=${u.name}`} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                              <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{u.name}</span>
                            </div>
                            <button 
                              onClick={() => handleAddMember(u._id)}
                              disabled={addingMemberIds.has(u._id)}
                              className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition self-start min-[350px]:self-auto shrink-0 disabled:opacity-50 flex items-center min-w-[100px] justify-center"
                            >
                              {addingMemberIds.has(u._id) ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                              {addingMemberIds.has(u._id) ? "Adding..." : "Add Member"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.members.map((member: any) => (
                  <div key={member._id} className="flex items-center space-x-4 p-4 border border-gray-100 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                    <div className="relative">
                      <img src={member.profileImage || `https://ui-avatars.com/api/?name=${member.name}`} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-slate-600" />
                      {onlineUsers.includes(member._id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/profile/${member._id}`} className="font-semibold text-gray-900 dark:text-white text-sm hover:text-indigo-600 dark:hover:text-indigo-400 truncate block">{member.name}</Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.headline || "Professional"}</p>
                      {member._id === group.admin._id && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">Admin</span>
                      )}
                    </div>
                    {isAdmin && member._id !== group.admin._id && (
                      <button 
                        onClick={() => handleRemoveMember(member._id)}
                        disabled={removingMemberIds.has(member._id)}
                        className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 px-3 py-1.5 rounded-lg transition disabled:opacity-50 flex items-center min-w-[80px] justify-center"
                      >
                        {removingMemberIds.has(member._id) ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                        {removingMemberIds.has(member._id) ? "Removing..." : "Remove"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "Settings" && isAdmin && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden p-8 max-w-2xl transition-colors">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Group Settings</h2>
              
              <form onSubmit={handleUpdateGroup} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
                  <input type="text" id="editGroupName" name="editGroupName" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <input type="text" id="editGroupCategory" name="editGroupCategory" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
                  <input type="text" id="editGroupTags" name="editGroupTags" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="e.g. React, Node, Frontend" className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
                  <select value={editVisibility} onChange={(e) => setEditVisibility(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="public">Public (Anyone can join)</option>
                    <option value="private">Private (Invite only)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea id="editGroupDesc" name="editGroupDesc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4} className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Rules (one rule per line)</label>
                  <textarea id="editGroupRules" name="editGroupRules" value={editRules} onChange={(e) => setEditRules(e.target.value)} rows={4} placeholder="E.g., Be respectful&#10;No spamming..." className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                  <button type="submit" disabled={updatingGroup} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center min-w-[160px]">
                    {updatingGroup && <Loader2 size={16} className="animate-spin mr-2" />}
                    {updatingGroup ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>

              <div className="mt-12 pt-8 border-t border-red-100 dark:border-red-900/30">
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Deleting this group will permanently remove all posts, chat messages, and member data associated with it. This action cannot be undone.</p>
                <button 
                  onClick={handleDeleteGroup}
                  disabled={deletingGroup}
                  className="px-6 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition flex items-center disabled:opacity-50 min-w-[160px] justify-center"
                >
                  {deletingGroup ? <Loader2 size={16} className="animate-spin mr-2" /> : <Trash2 size={16} className="mr-2" />}
                  {deletingGroup ? "Deleting..." : "Delete Group"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
