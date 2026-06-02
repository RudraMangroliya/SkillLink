import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { MapPin, Briefcase, GraduationCap, Edit2, Camera, UserPlus, CheckCircle2, XCircle, Share2, FileText, ChevronRight, MessageSquare, Loader2, Link as LinkIcon, Plus, UserCheck, X, Award, FolderGit2 } from "lucide-react";
import PageLoader from "../components/PageLoader";
import axiosInstance from "../utils/axios";
import EditProfileModal from "../components/EditProfileModal";
import UserListModal from "../components/UserListModal";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import BorderGlow from "../components/BorderGlow";

export default function ProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!user;
  const { userId } = useParams<{ userId: string }>();
  const isOwnProfile = !userId || userId === user?._id;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [endorsing, setEndorsing] = useState<string | null>(null);
  const [recommendationText, setRecommendationText] = useState("");
  const [submittingRec, setSubmittingRec] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectionRequestId, setConnectionRequestId] = useState<string | null>(null);
  const [connectionRequester, setConnectionRequester] = useState<string | null>(null);
  const [mutualConnections, setMutualConnections] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isConnectingLoading, setIsConnectingLoading] = useState(false);
  const [isDisconnectingLoading, setIsDisconnectingLoading] = useState(false);
  const [isAcceptingLoading, setIsAcceptingLoading] = useState(false);
  const [isRejectingLoading, setIsRejectingLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // User List Modal State
  const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
  const [userListTitle, setUserListTitle] = useState("");
  const [userListData, setUserListData] = useState<any[]>([]);

  const fetchProfile = React.useCallback(async () => {
    try {
      const url = userId ? `/api/profile/user/${userId}` : "/api/profile";
      const res = await axiosInstance.get(url);
      setProfile(res.data);
      setFollowersCount(res.data.followers?.length || 0);
      if (user && res.data.followers?.some((f: any) => f._id === user._id)) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }

      if (userId && userId !== user?._id) {
         try {
           const mutRes = await axiosInstance.get(`/api/profile/mutual/${res.data.user._id}`);
           setMutualConnections(mutRes.data);
         } catch (e) { console.error(e); }
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setProfile(null);
      } else {
        setError(err.response?.data?.message || "Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  }, [userId, user?._id]);

  const fetchConnectionStatus = React.useCallback(async (targetUserId: string) => {
    if (!isAuthenticated || isOwnProfile) return;
    try {
      const res = await axiosInstance.get("/api/connections/status");
      const myId = user?._id;
      const connection = res.data.find((conn: any) => 
        (String(conn.requester) === String(myId) && String(conn.recipient) === String(targetUserId)) ||
        (String(conn.requester) === String(targetUserId) && String(conn.recipient) === String(myId))
      );
      if (connection) {
        setConnectionStatus(connection.status);
        setConnectionRequestId(connection._id);
        const reqId = typeof connection.requester === 'object' ? connection.requester._id : connection.requester;
        setConnectionRequester(String(reqId));
      } else {
        setConnectionStatus(null);
        setConnectionRequestId(null);
        setConnectionRequester(null);
      }
    } catch (err) {
      console.error(err);
    }
  }, [isAuthenticated, isOwnProfile, user?._id]);

  const handleFollow = async () => {
    if (!profile?.user?._id) return;
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await axiosInstance.post(`/api/profile/unfollow/${profile.user._id}`);
      } else {
        await axiosInstance.post(`/api/profile/follow/${profile.user._id}`);
      }
      await fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    if (profile?.user?._id && isAuthenticated && user?._id) {
       fetchConnectionStatus(profile.user._id);
    }
  }, [profile?.user?._id, isAuthenticated, user?._id]);

  useEffect(() => {
    const handleNewNotification = (e: any) => {
      const notification = e.detail;
      if (!profile?.user?._id) return;
      
      // If we receive a connection request or acceptance from the user whose profile we are viewing
      if (
        (notification.type === 'connection_request' || notification.type === 'accepted') && 
        String(notification.sender?._id) === String(profile.user._id)
      ) {
        fetchConnectionStatus(profile.user._id);
        if (notification.type === 'accepted') fetchProfile();
      }

      // If we receive a follow notification and we are viewing our own profile
      if (notification.type === 'follow' && String(profile.user._id) === String(user?._id)) {
        fetchProfile();
      }
    };
    const handleConnectionRemoved = (e: any) => {
      const data = e.detail;
      if (!profile?.user?._id) return;
      if (String(data.userId) === String(profile.user._id)) {
        fetchConnectionStatus(profile.user._id);
        fetchProfile();
      }
    };

    window.addEventListener('new_notification', handleNewNotification);
    window.addEventListener('connection_removed', handleConnectionRemoved);
    return () => {
      window.removeEventListener('new_notification', handleNewNotification);
      window.removeEventListener('connection_removed', handleConnectionRemoved);
    };
  }, [profile?.user?._id, user?._id, fetchProfile, fetchConnectionStatus]);

  const handleEndorse = async (skill: string) => {
    if (!profile?.user?._id) return;
    setEndorsing(skill);
    try {
      const res = await axiosInstance.post(`/api/profile/endorse/${profile.user._id}`, { skill });
      setProfile(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setEndorsing(null);
    }
  };

  const handleConnect = async () => {
    if (!profile?.user?._id) return;
    setIsConnectingLoading(true);
    try {
      setConnectionStatus("Pending");
      setConnectionRequester(String(user?._id));
      await axiosInstance.post("/api/connections/request", { recipientId: profile.user._id });
      queryClient.invalidateQueries({ queryKey: ['connectionStatus'] });
    } catch (err: any) {
      console.error("Connect error:", err);
      const errMsg = err.response?.data?.message || "Error";
      if (errMsg === "Connection request already exists") {
        setConnectionStatus("Pending");
      } else {
        setConnectionStatus("Error");
      }
    } finally {
      setIsConnectingLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!profile?.user?._id) return;
    setIsDisconnectingLoading(true);
    try {
      await axiosInstance.delete(`/api/connections/remove/${profile.user._id}`);
      setConnectionStatus(null);
      setConnectionRequestId(null);
      setConnectionRequester(null);
      queryClient.invalidateQueries({ queryKey: ['connectionStatus'] });
      fetchProfile();
    } catch (err) {
      console.error("Disconnect error:", err);
    } finally {
      setIsDisconnectingLoading(false);
    }
  };

  const handleAcceptConnection = async () => {
    if (!connectionRequestId) return;
    setIsAcceptingLoading(true);
    try {
      await axiosInstance.post(`/api/connections/accept/${connectionRequestId}`);
      setConnectionStatus("Accepted");
      queryClient.invalidateQueries({ queryKey: ['connectionStatus'] });
      fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAcceptingLoading(false);
    }
  };

  const handleRejectConnection = async () => {
    if (!connectionRequestId) return;
    setIsRejectingLoading(true);
    try {
      await axiosInstance.post(`/api/connections/reject/${connectionRequestId}`);
      setConnectionStatus(null);
      setConnectionRequestId(null);
      setConnectionRequester(null);
      queryClient.invalidateQueries({ queryKey: ['connectionStatus'] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRejectingLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!profile?.user?._id) return;
    try {
      await axiosInstance.post("/api/chats", { userId: profile.user._id });
      navigate("/chat");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user?._id || !recommendationText.trim()) return;
    setSubmittingRec(true);
    try {
      const res = await axiosInstance.post(`/api/profile/recommend/${profile.user._id}`, { text: recommendationText });
      setProfile(res.data);
      setRecommendationText("");
    } catch (err: any) {
      console.error(err);
    } finally {
      setSubmittingRec(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!profile?.user?._id) return;
    setGeneratingDraft(true);
    try {
      const res = await axiosInstance.get(`/api/profile/generate-draft/${profile.user._id}`);
      if (res.data && res.data.draft) {
        setRecommendationText(res.data.draft);
      }
    } catch (err: any) {
      console.error("Generate draft error:", err);
    } finally {
      setGeneratingDraft(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex justify-center pt-32">
        <PageLoader fullPage={true} label="Loading profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center pt-20 transition-colors">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-500 p-4 rounded-xl border border-red-100 dark:border-red-900/50">{error}</div>
      </div>
    );
  }

  const displayData = profile || {
    headline: "Welcome to SkillLink!",
    bio: "You haven't set up your profile yet. Complete onboarding to show your details.",
    skills: [],
    location: "Not specified",
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    endorsements: [],
    recommendations: [],
    profileCompletionScore: 0
  };

  const displayUser = isOwnProfile ? user : profile?.user;

  // Calculate missing fields dynamically
  const missingFields = [];
  if (!displayData.headline) missingFields.push("a headline");
  if (!displayData.bio) missingFields.push("a bio");
  if (!displayData.location) missingFields.push("your location");
  if (!displayData.skills || displayData.skills.length < 3) missingFields.push("more skills");
  if (!displayData.interests || displayData.interests.length === 0) missingFields.push("interests");
  if (!displayData.education || displayData.education.length === 0) missingFields.push("education details");
  if (!displayData.resumeUrl) missingFields.push("your resume");
  if (!displayData.experience || displayData.experience.length === 0) missingFields.push("work experience");
  if (!displayData.projects || displayData.projects.length === 0) missingFields.push("projects");
  if (!displayData.certifications || displayData.certifications.length === 0) missingFields.push("certifications");

  const suggestionText = missingFields.length > 0 
    ? `Add ${missingFields.slice(0, 2).join(" and ")} to reach 100% and get discovered by top recruiters!`
    : "Your profile is looking great!";

  const scoreColor = displayData.profileCompletionScore < 50 ? "bg-red-500" : displayData.profileCompletionScore < 80 ? "bg-yellow-500" : "bg-green-500";
  const textColor = displayData.profileCompletionScore < 50 ? "text-red-600 dark:text-red-500" : displayData.profileCompletionScore < 80 ? "text-yellow-600 dark:text-yellow-500" : "text-green-600 dark:text-green-500";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-8 pb-12 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-2 min-[340px]:px-4 sm:px-6 lg:px-8">

        {/* Profile Completion Card (if not 100%) */}
        {isOwnProfile && displayData.profileCompletionScore < 100 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-indigo-100 dark:border-slate-700 p-3 min-[340px]:p-5 sm:p-6 mb-6 transition-all duration-300 hover:shadow-md animate-fade-in-slide">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  Profile Strength: 
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                    displayData.profileCompletionScore < 50 
                      ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400" 
                      : displayData.profileCompletionScore < 80 
                        ? "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400" 
                        : "bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400"
                  }`}>
                    {displayData.profileCompletionScore < 50 ? "Beginner" : displayData.profileCompletionScore < 80 ? "Intermediate" : "Advanced"}
                  </span>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 sm:max-w-xl leading-relaxed">{suggestionText}</p>
              </div>
              <div className="relative flex-shrink-0 flex items-center justify-center w-28 h-28 hover:scale-105 transition-transform duration-300">
                {/* SVG Radial circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-gray-100 dark:stroke-slate-700 fill-transparent"
                    strokeWidth="8"
                  />
                  {/* Animated Score Progress Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={`fill-transparent transition-all duration-1000 ease-out ${
                      displayData.profileCompletionScore < 50 
                        ? "stroke-red-500" 
                        : displayData.profileCompletionScore < 80 
                          ? "stroke-yellow-500" 
                          : "stroke-green-500"
                    }`}
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - displayData.profileCompletionScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-2xl font-black ${textColor}`}>{displayData.profileCompletionScore}%</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-gray-400 dark:text-slate-500 mt-0.5">Strength</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
          <div
            className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative bg-cover bg-center"
            style={displayUser?.backgroundImage ? { backgroundImage: `url(${displayUser.backgroundImage})` } : {}}
          >
            {isOwnProfile && (
              <button onClick={() => setIsEditModalOpen(true)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-sm transition-colors text-white">
                <Camera size={20} />
              </button>
            )}
          </div>

          <div className="px-3 min-[340px]:px-4 sm:px-8 pb-8 relative">
            <div className="relative -mt-20 mb-4 inline-block">
              <img
                src={displayUser?.profileImage || `https://ui-avatars.com/api/?name=${displayUser?.name}&background=random&size=150`}
                alt="Profile"
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-slate-800 shadow-lg object-cover bg-white dark:bg-slate-800 transition-colors"
              />
              {isOwnProfile && (
                <button onClick={() => setIsEditModalOpen(true)} className="absolute bottom-2 right-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 p-2 rounded-full border border-gray-200 dark:border-slate-600 transition-colors">
                  <Camera size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
              )}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 min-w-0">
              <div className="min-w-0 w-full">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white break-words">{displayUser?.name}</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mt-1 break-words">{displayData.headline}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                  <button 
                    onClick={() => {
                      setUserListTitle("Followers");
                      setUserListData(profile?.followers || []);
                      setIsUserListModalOpen(true);
                    }}
                    className="hover:text-indigo-600 transition"
                  >
                    <strong className="text-gray-900 dark:text-white">{followersCount}</strong> followers
                  </button>
                  <button 
                    onClick={() => {
                      setUserListTitle("Following");
                      setUserListData(profile?.following || []);
                      setIsUserListModalOpen(true);
                    }}
                    className="hover:text-indigo-600 transition"
                  >
                    <strong className="text-gray-900 dark:text-white">{profile?.following?.length || 0}</strong> following
                  </button>
                </div>
                {mutualConnections.length > 0 && !isOwnProfile && (
                  <div className="text-sm text-gray-500 mt-1">
                    {mutualConnections.length} mutual connection{mutualConnections.length > 1 ? 's' : ''}: {mutualConnections.slice(0, 2).map(m => m.name).join(', ')} {mutualConnections.length > 2 ? `and ${mutualConnections.length - 2} others` : ''}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-gray-500 text-sm">
                  {displayData.location && (
                    <span className="flex items-center"><MapPin size={16} className="mr-1" /> {displayData.location}</span>
                  )}
                  {displayData.experience && displayData.experience.length > 0 && (
                    <span className="flex items-center"><Briefcase size={16} className="mr-1" /> {displayData.experience[0].company}</span>
                  )}
                  {displayData.education && displayData.education.length > 0 && (
                    <span className="flex items-center"><GraduationCap size={16} className="mr-1" /> {displayData.education[0].institution}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 w-full md:w-auto mt-4 md:mt-0">
                {isOwnProfile ? (
                  <button onClick={() => setIsEditModalOpen(true)} className="flex-1 md:flex-none bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 px-3 py-2 min-[340px]:px-4 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-sm hover:shadow text-xs min-[340px]:text-sm sm:text-base">
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleFollow}
                      disabled={isFollowLoading}
                      className={`flex-1 md:flex-none px-3 py-2 min-[340px]:px-6 rounded-lg font-medium transition shadow-sm hover:shadow text-xs min-[340px]:text-sm sm:text-base border flex items-center justify-center disabled:opacity-50 ${
                        isFollowing 
                          ? "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700" 
                          : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {isFollowLoading ? <Loader2 className="animate-spin h-4 w-4" /> : isFollowing ? "Unfollow" : "Follow"}
                    </button>
                    {connectionStatus === "Accepted" ? (
                      <>
                        <button 
                          onClick={handleStartChat}
                          className="flex-1 md:flex-none bg-indigo-600 text-white px-3 py-2 min-[340px]:px-6 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm text-xs min-[340px]:text-sm sm:text-base flex items-center justify-center"
                        >
                          Message
                        </button>
                        <button 
                          onClick={handleDisconnect}
                          disabled={isDisconnectingLoading}
                          className="flex-1 md:flex-none bg-red-50 text-red-600 border border-red-200 px-3 py-2 min-[340px]:px-6 rounded-lg font-medium hover:bg-red-100 hover:text-red-700 transition shadow-sm text-xs min-[340px]:text-sm sm:text-base flex items-center justify-center disabled:opacity-50"
                        >
                          {isDisconnectingLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Disconnect"}
                        </button>
                      </>
                    ) : connectionStatus === "Pending" && String(connectionRequester) !== String(user?._id) ? (
                      <div className="flex flex-1 md:flex-none gap-2">
                        <button 
                          onClick={handleAcceptConnection}
                          disabled={isAcceptingLoading}
                          className="flex-1 bg-indigo-600 text-white px-3 py-2 min-[340px]:px-6 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm text-xs min-[340px]:text-sm sm:text-base flex items-center justify-center disabled:opacity-50"
                        >
                          {isAcceptingLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Accept"}
                        </button>
                        <button 
                          onClick={handleRejectConnection}
                          disabled={isRejectingLoading}
                          className="flex-1 bg-red-50 text-red-600 border border-red-200 px-3 py-2 min-[340px]:px-6 rounded-lg font-medium hover:bg-red-100 hover:text-red-700 transition shadow-sm text-xs min-[340px]:text-sm sm:text-base flex items-center justify-center disabled:opacity-50"
                        >
                          {isRejectingLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Reject"}
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={handleConnect}
                        disabled={connectionStatus === "Pending" || isConnectingLoading}
                        className="flex-1 md:flex-none bg-indigo-600 text-white px-3 py-2 min-[340px]:px-6 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm text-xs min-[340px]:text-sm sm:text-base flex items-center justify-center disabled:opacity-50"
                      >
                        {isConnectingLoading || connectionStatus === "Pending" ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <UserPlus size={16} className="mr-1 sm:mr-2" />}
                        {connectionStatus === "Pending" ? "Pending..." : isConnectingLoading ? "Connecting..." : "Connect"}
                      </button>
                    )}
                  </>
                )}
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Profile link copied to clipboard!");
                  }} 
                  className="flex-1 md:flex-none bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 px-3 py-2 min-[340px]:px-4 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-sm hover:shadow text-xs min-[340px]:text-sm sm:text-base flex justify-center items-center"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-3 sm:p-8 transition-colors min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line break-words">{displayData.bio}</p>
            </div>

            {/* Experience */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-3 sm:p-8 transition-colors min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Experience</h2>
              {displayData.experience && displayData.experience.length > 0 ? (
                <div className="space-y-6">
                  {displayData.experience.map((exp: any, index: number) => (
                    <div key={index} className="flex gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words">{exp.title || exp.role}</h3>
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 break-words">{exp.company}</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{exp.startYear || exp.from} - {exp.current ? "Present" : exp.endYear || exp.to}</p>
                        {exp.description && <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 break-words">{exp.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">No experience added yet.</p>
              )}
            </div>

            {/* Education */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-3 sm:p-8 transition-colors min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Education</h2>
              {displayData.education && displayData.education.length > 0 ? (
                <div className="space-y-6">
                  {displayData.education.map((edu: any, index: number) => (
                    <div key={index} className="flex gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words">{edu.institution}</h3>
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 break-words">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</p>
                        {(edu.startYear || edu.endYear) && (
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 break-words">{edu.startYear} - {edu.endYear || 'Present'}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">No education added yet.</p>
              )}
            </div>

            {/* Projects */}
            {displayData.projects && displayData.projects.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-3 sm:p-8 transition-colors min-w-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Projects</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayData.projects.map((proj: any, index: number) => (
                    <BorderGlow key={index} borderRadius={12} className="min-w-0 h-full">
                      <div className="p-3 sm:p-4 flex flex-col h-full justify-between">
                        <div>
                          <div className="flex items-center mb-2 min-w-0">
                            <FolderGit2 size={18} className="text-indigo-600 dark:text-indigo-400 mr-2 shrink-0" />
                            <h3 className="font-bold text-gray-900 dark:text-white break-words min-w-0">{proj.title}</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 break-words mb-3">{proj.description}</p>
                        </div>
                        {proj.link && (
                          <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center break-words mt-auto">
                            View Project <LinkIcon size={14} className="ml-1 shrink-0" />
                          </a>
                        )}
                      </div>
                    </BorderGlow>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {displayData.certifications && displayData.certifications.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-3 sm:p-8 transition-colors min-w-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Certifications</h2>
                <div className="space-y-4">
                  {displayData.certifications.map((cert: any, index: number) => (
                    <div key={index} className="flex gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center text-yellow-600 dark:text-yellow-400 shrink-0">
                        <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words">{cert.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{cert.issuer}</p>
                        {cert.date && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(cert.date).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-3 sm:p-8 mt-6 transition-colors min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recommendations</h2>
              
              {displayData.recommendations && displayData.recommendations.length > 0 ? (
                <div className="space-y-6 mb-6">
                  {displayData.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-slate-600 min-w-0">
                      <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 italic mb-3 break-words">"{rec.text}"</p>
                      <div className="flex items-center min-w-0">
                        <img src={rec.recommender?.profileImage || `https://ui-avatars.com/api/?name=${rec.recommender?.name}&background=random`} alt={rec.recommender?.name} className="w-8 h-8 rounded-full mr-3 shrink-0 object-cover" />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white break-words">{rec.recommender?.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic mb-6">No recommendations yet.</p>
              )}

              {!isOwnProfile && (
                <form onSubmit={handleRecommend} className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Write a recommendation</h3>
                    <button 
                      type="button" 
                      onClick={handleGenerateDraft} 
                      disabled={generatingDraft}
                      className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center hover:text-indigo-800 dark:hover:text-indigo-300 disabled:opacity-50"
                    >
                      {generatingDraft ? "Generating..." : "✨ AI Suggestion"}
                    </button>
                  </div>
                  <textarea 
                    id="recommendationText"
                    name="recommendationText"
                    rows={4} 
                    className="w-full bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none resize-none mb-3 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder={`What was it like working with ${displayUser?.name?.split(' ')[0]}?`}
                    value={recommendationText}
                    onChange={(e) => setRecommendationText(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    disabled={submittingRec || !recommendationText.trim()}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center"
                  >
                    {submittingRec && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                    {submittingRec ? "Submitting..." : "Submit Recommendation"}
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 sm:p-6 transition-colors">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Skills & Endorsements</h2>
              {displayData.skills && displayData.skills.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {displayData.skills.map((skill: string) => {
                    const endorsement = displayData.endorsements?.find((e: any) => e.skill === skill);
                    const count = endorsement?.endorsers?.length || 0;
                    const hasEndorsed = endorsement?.endorsers?.includes(user?._id);

                    return (
                      <div key={skill} className="flex items-center bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-100 dark:border-indigo-800/50 overflow-hidden">
                        <span className="px-3 py-1.5 text-indigo-700 dark:text-indigo-400 text-sm font-medium">
                          {skill}
                        </span>
                        {count > 0 && (
                          <span className="px-2 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs font-bold border-l border-indigo-200 dark:border-indigo-800/50">
                            {count}
                          </span>
                        )}
                        {!isOwnProfile && (
                          <button 
                            onClick={() => handleEndorse(skill)}
                            disabled={endorsing === skill}
                            className={`px-2 py-1.5 text-xs font-medium border-l border-indigo-200 dark:border-indigo-800/50 transition flex items-center justify-center disabled:opacity-70 ${hasEndorsed ? 'bg-indigo-600 dark:bg-indigo-500 text-white' : 'hover:bg-indigo-200 dark:hover:bg-indigo-800/80 text-indigo-700 dark:text-indigo-400'}`}
                            title={hasEndorsed ? "Remove endorsement" : "Endorse skill"}
                          >
                            {endorsing === skill ? <Loader2 className="animate-spin h-3 w-3" /> : "+"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm italic">No skills added yet.</p>
              )}
            </div>

            {(displayData.interests && displayData.interests.length > 0) && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 sm:p-6 transition-colors">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Interests / Preferred Roles</h2>
                <div className="flex flex-wrap gap-2">
                  {displayData.interests.map((interest: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 sm:p-6 transition-colors">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Links & Resume</h2>
              <div className="space-y-4">
                {displayData.githubLink && (
                  <a href={displayData.githubLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition truncate break-all min-w-0">
                    <LinkIcon size={20} className="mr-3 flex-shrink-0" /> <span className="truncate">{displayData.githubLink}</span>
                  </a>
                )}
                {displayData.portfolioLink && (
                  <a href={displayData.portfolioLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition truncate break-all min-w-0">
                    <LinkIcon size={20} className="mr-3 flex-shrink-0" /> <span className="truncate">{displayData.portfolioLink}</span>
                  </a>
                )}
                {displayData.resumeUrl && (
                  <a href={displayData.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-white bg-gray-900 dark:bg-slate-700 hover:bg-gray-800 dark:hover:bg-slate-600 px-4 py-2 rounded-lg transition">
                    <FileText size={18} className="mr-2 flex-shrink-0" /> View Resume (PDF)
                  </a>
                )}
                {!displayData.githubLink && !displayData.portfolioLink && !displayData.resumeUrl && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic">No links or resume added yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profileData={profile}
        onSuccess={fetchProfile}
      />
      <UserListModal
        isOpen={isUserListModalOpen}
        onClose={() => setIsUserListModalOpen(false)}
        title={userListTitle}
        users={userListData}
      />
    </div>
  );
}
