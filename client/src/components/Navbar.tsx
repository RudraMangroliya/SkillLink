import { Link, useNavigate, useLocation } from "react-router-dom";
import { Briefcase, Users, MessageSquare, ShieldAlert, User, LogOut, Menu, X, Search, UsersRound, Bell, CheckCircle2, UserPlus } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store";
import { logout } from "../store/slices/authSlice";
import { useState, useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import axiosInstance from "../utils/axios";
import io, { Socket } from "socket.io-client";

// Programmatic, high-quality audio chime for premium notification alerts
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Tone 1: Fundamental sweet chime (C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now); // C5
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
    osc2.frequency.setValueAtTime(783.99, now + 0.08); // G5
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.6, now + 0.095);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch (error) {
    console.warn("Failed to play programmatic notification sound:", error);
  }
};

export default function Navbar() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Fetch notifications
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      
      // Setup individual socket for global notifications
      if (user) {
        const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
          transports: ["websocket"],
        });
        newSocket.emit("setup", user);
        
        newSocket.on("new notification", (notification) => {
          const currentPath = window.location.pathname;
          let isActivelyViewing = false;

          if (notification.type === "message" && currentPath.startsWith("/chat")) {
            isActivelyViewing = true;
          } else if (
            (notification.type === "comment" || notification.type === "group_invite") && 
            notification.relatedId && 
            currentPath === `/groups/${notification.relatedId}`
          ) {
            isActivelyViewing = true;
          }

          if (isActivelyViewing) {
            // Silently mark it as read on the backend since they are looking right at it
            axiosInstance.put(`/api/notifications/${notification._id}/read`).catch(console.error);
          } else {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            playNotificationSound();
          }
          window.dispatchEvent(new CustomEvent('new_notification', { detail: notification }));
        });

        newSocket.on("connection_removed", (data) => {
          window.dispatchEvent(new CustomEvent('connection_removed', { detail: data }));
        });

        setSocket(newSocket);

        return () => {
          newSocket.disconnect();
        };
      }
    }
  }, [isAuthenticated, user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get("/api/notifications");
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: any) => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      try {
        await axiosInstance.put(`/api/notifications/${notification._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }

    setShowNotifications(false);

    // Navigate based on type
    if (notification.type === "follow" || notification.type === "connection_request" || notification.type === "accepted") {
      if (notification.sender?._id) {
        navigate(`/profile/${notification.sender._id}`);
      } else {
        navigate("/network");
      }
    } else if (notification.type === "comment" || notification.type === "group_invite") {
      if (notification.relatedId) {
        navigate(`/groups/${notification.relatedId}`);
      } else {
        navigate("/groups");
      }
    } else if (notification.type === "message") {
      navigate("/chat");
    } else if (notification.type === "job_applied" || notification.type === "job_status_update" || notification.type === "job_match") {
      navigate("/jobs");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.put("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await axiosInstance.delete("/api/notifications/clear");
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout failed on server", error);
    }
    dispatch(logout());
    navigate("/login");
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
              SkillLink
            </Link>
          </div>
          
          {/* Mobile menu buttons */}
          <div className="flex items-center space-x-1 lg:hidden">
            {isAuthenticated && (
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-50 transition cursor-pointer"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-500 hover:text-indigo-600 p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4 xl:space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/explore" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${isActive("/explore") ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                  <Search size={18} />
                  <span>Explore</span>
                </Link>
                <Link to="/network" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${isActive("/network") ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                  <Users size={18} />
                  <span>Network</span>
                </Link>
                <Link to="/groups" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${isActive("/groups") ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                  <UsersRound size={18} />
                  <span>Groups</span>
                </Link>
                <Link to="/jobs" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${isActive("/jobs") ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                  <Briefcase size={18} className="mr-1.5" /> Jobs
                </Link>
                {user?.role !== "admin" && (
                  <Link to="/chat" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${isActive("/chat") ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                    <MessageSquare size={18} />
                    <span>Chat</span>
                  </Link>
                )}
                <Link to="/profile" className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${isActive("/profile") ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                  <User size={18} />
                  <span>Profile</span>
                </Link>
                
                {user?.role === "admin" && (
                  <Link to="/admin" className="text-red-500 hover:text-red-600 flex items-center transition font-medium text-sm lg:text-base">
                    <ShieldAlert size={18} className="mr-1.5" /> Admin
                  </Link>
                )}

                <div className="border-l border-gray-200 dark:border-gray-700 h-6 mx-1 lg:mx-2"></div>
                
                <ThemeToggle />
                
                {/* NOTIFICATIONS DESKTOP TRIGGER */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                <div className="border-l border-gray-200 dark:border-gray-700 h-6 mx-1 lg:mx-2"></div>
                
                <button onClick={handleLogout} className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center transition text-sm lg:text-base cursor-pointer">
                  <LogOut size={18} className="mr-1.5" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 font-medium hover:text-indigo-600 transition text-sm lg:text-base">
                  Log in
                </Link>
                <Link to="/register" className="bg-indigo-600 text-white px-4 lg:px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm text-sm lg:text-base">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* SHARED NOTIFICATIONS DROPDOWN CONTAINER */}
        {showNotifications && (
          <div ref={dropdownRef} className="absolute right-2 sm:right-6 top-16 w-80 sm:w-96 max-w-[calc(100vw-1rem)] bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-gray-100 dark:border-slate-700 py-2 z-50 overflow-hidden transition-all duration-200 ring-1 ring-black/5 dark:ring-white/10">
            <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 flex flex-wrap gap-2 justify-between items-center">
              <span className="font-bold text-gray-900 dark:text-white text-sm">Notifications</span>
              {notifications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                  <button 
                    onClick={handleClearAllNotifications}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold transition cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n: any) => (
                  <div 
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 flex items-start space-x-3 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition cursor-pointer relative ${!n.isRead ? "bg-indigo-50/30 dark:bg-indigo-900/20" : ""}`}
                  >
                    <img 
                      src={n.sender?.profileImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (n.sender?.name || "User")} 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-600 flex-shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-medium line-clamp-2">
                        {n.message || "New notification received"}
                      </p>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1">
                        {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 mt-1" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 w-[260px] max-w-[80vw] bg-white dark:bg-gray-900 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">SkillLink</span>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col space-y-1">
          {isAuthenticated ? (
            <>
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/explore" className={`flex items-center px-3 py-3 rounded-xl transition font-medium ${isActive("/explore") ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <Search size={20} className="mr-3" /> Explore
              </Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/network" className={`flex items-center px-3 py-3 rounded-xl transition font-medium ${isActive("/network") ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <Users size={20} className="mr-3" /> Network
              </Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/groups" className={`flex items-center px-3 py-3 rounded-xl transition font-medium ${isActive("/groups") ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <UsersRound size={20} className="mr-3" /> Groups
              </Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/jobs" className={`flex items-center px-3 py-3 rounded-xl transition font-medium ${isActive("/jobs") ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <Briefcase size={20} className="mr-3" /> Jobs
              </Link>
              {user?.role !== "admin" && (
                <Link onClick={() => setIsMobileMenuOpen(false)} to="/chat" className={`flex items-center px-3 py-3 rounded-xl transition font-medium ${isActive("/chat") ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                  <MessageSquare size={20} className="mr-3" /> Chat
                </Link>
              )}
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/profile" className={`flex items-center px-3 py-3 rounded-xl transition font-medium ${isActive("/profile") ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <User size={20} className="mr-3" /> Profile
              </Link>
              
              {user?.role === "admin" && (
                <Link onClick={() => setIsMobileMenuOpen(false)} to="/admin" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center px-3 py-3 rounded-xl transition font-medium mt-2 border border-red-100 dark:border-red-900/30">
                  <ShieldAlert size={20} className="mr-3" /> Admin Dashboard
                </Link>
              )}
            </>
          ) : (
            <div className="flex flex-col space-y-3 pt-2">
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/login" className="w-full text-center text-gray-700 dark:text-gray-300 font-semibold border border-gray-200 dark:border-slate-700 py-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:hover:text-white transition shadow-sm">
                Log in
              </Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/register" className="w-full text-center bg-indigo-600 dark:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition shadow-md hover:shadow-lg">
                Sign up
              </Link>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-center mb-4">
              <ThemeToggle />
            </div>
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }} 
              className="w-full text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center px-3 py-2.5 rounded-xl transition font-semibold cursor-pointer border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
            >
              <LogOut size={20} className="mr-2" /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
