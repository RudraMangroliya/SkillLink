import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import io, { Socket } from "socket.io-client";
import { Search, Send, Phone, Video, Info, Edit2, Trash2, Smile, Paperclip, Mic, MoreVertical, ArrowLeft, CornerUpLeft, Pin, PinOff, Sparkles, ShieldAlert, Loader2 } from "lucide-react";
import axiosInstance from "../utils/axios";
import EmojiPicker from 'emoji-picker-react';

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

export default function ChatPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Advanced Interactions
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Notes
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chat Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // UI States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showCallModal, setShowCallModal] = useState<'voice' | 'video' | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Smart Reply AI State
  const [smartReplies, setSmartReplies] = useState<string[]>([]);

  // User search and connections
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [connections, setConnections] = useState<any[]>([]);

  const fetchChats = async () => {
    try {
      const res = await axiosInstance.get("/api/chats");
      setChats(res.data);
      
      // Mark all unread/undelivered messages in these chats as delivered now that the user is online
      res.data.forEach((chat: any) => {
        if (chat.latestMessage && chat.latestMessage.sender?._id !== user?._id) {
          const isDelivered = chat.latestMessage.deliveredTo?.includes(user?._id);
          if (!isDelivered) {
             axiosInstance.put("/api/messages/deliver", { chatId: chat._id }).then(() => {
               if (socket) {
                 socket.emit("message delivered", { chat, deliveredUser: user?._id });
               }
             });
          }
        }
      });
    } catch (error) {
      console.error("Error fetching chats", error);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim() || !selectedChat) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/api/messages/${selectedChat._id}/search?q=${searchQuery}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error("Error searching messages", err);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedChat]);

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      const res = await axiosInstance.get(`/api/messages/${selectedChat._id}`);
      setMessages(res.data);
      socket.emit("join chat", selectedChat._id);
      
      // Mark as read
      await axiosInstance.put("/api/messages/read", { chatId: selectedChat._id });
      // Tell others we've seen it
      socket.emit("message seen", { chat: selectedChat, seenUser: user?._id });
      // Update sidebar to clear unread badge
      fetchChats();
    } catch (error) {
      console.error("Error fetching messages", error);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
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
  }, [messages, user]);

  const fetchConnections = async () => {
    try {
      const res = await axiosInstance.get("/api/connections");
      setConnections(res.data);
    } catch (error) {
      console.error("Error fetching connections", error);
    }
  };

  useEffect(() => {
    fetchChats();
    fetchConnections();
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [selectedChat]);

  useEffect(() => {
    socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    if (user) {
      socket.emit("setup", user);
      socket.on("connected", () => setSocketConnected(true));
      socket.on("disconnect", () => setSocketConnected(false));
      socket.on("online users", (users) => setOnlineUsers(users));
      socket.on("user online", (userId) => setOnlineUsers(prev => [...prev, userId]));
      socket.on("user offline", (userId) => setOnlineUsers(prev => prev.filter(id => id !== userId)));

      const handleReconnect = () => {
        if (socket && !socket.connected) {
          socket.connect();
          socket.emit("setup", user);
        }
      };

      window.addEventListener("focus", handleReconnect);
      document.addEventListener("visibilitychange", handleReconnect);

      return () => {
        window.removeEventListener("focus", handleReconnect);
        document.removeEventListener("visibilitychange", handleReconnect);
        socket.disconnect();
      };
    }
    return () => {
      socket.disconnect();
    };
  }, [user]);
  useEffect(() => {
    socket.on("message received", (newMessageReceived) => {
      // Tell sender we received it
      socket.emit("message delivered", { 
        ...newMessageReceived, 
        senderId: newMessageReceived.sender._id,
        deliveredUser: user?._id
      });
      
      // Update DB that it was delivered
      axiosInstance.put("/api/messages/deliver", { chatId: newMessageReceived.chat._id });

      if (!selectedChat || selectedChat._id !== newMessageReceived.chat._id) {
        // Just update chat unread counts by fetching chats again
        fetchChats();
        playNotificationChime();
      } else {
        setMessages((prev) => [...prev, newMessageReceived]);
        axiosInstance.put("/api/messages/read", { chatId: selectedChat._id }).then(() => {
          socket.emit("message seen", { ...newMessageReceived, chat: selectedChat, senderId: newMessageReceived.sender._id, seenUser: user?._id });
          fetchChats();
        });
        playSubtlePop();
      }
    });

    socket.on("message updated", (updatedMessage) => {
      if (selectedChat && selectedChat._id === updatedMessage.chat._id) {
        setMessages((prev) => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
        axiosInstance.put("/api/messages/read", { chatId: selectedChat._id }).then(() => {
          socket.emit("message seen", { chat: selectedChat, seenUser: user?._id });
          fetchChats();
        });
      } else {
        fetchChats();
      }
    });

    socket.on("message deleted", (deletedMessage) => {
      if (selectedChat && selectedChat._id === deletedMessage.chat._id) {
        setMessages((prev) => prev.map(m => m._id === deletedMessage._id ? deletedMessage : m));
        axiosInstance.put("/api/messages/read", { chatId: selectedChat._id }).then(() => {
          fetchChats();
        });
      } else {
        fetchChats();
      }
    });

    socket.on("message delivered", (messageData) => {
      if (selectedChat && selectedChat._id === messageData.chat._id) {
        setMessages((prev) => prev.map(m => {
          if (!messageData._id || m._id === messageData._id) {
            return { ...m, deliveredTo: [...(m.deliveredTo || []), messageData.deliveredUser || user?._id] };
          }
          return m;
        }));
      }
    });

    socket.on("message seen", (messageData) => {
      if (selectedChat && selectedChat._id === messageData.chat._id) {
        setMessages((prev) => prev.map(m => {
          if (!messageData._id || m._id === messageData._id) {
            if (!m.readBy?.includes(messageData.seenUser)) {
              return { ...m, readBy: [...(m.readBy || []), messageData.seenUser || user?._id] };
            }
          }
          return m;
        }));
      }
    });

    socket.on("typing", (room) => {
      if (selectedChat && selectedChat._id === room) {
        setIsTyping(true);
      }
    });

    socket.on("stop typing", (room) => {
      if (selectedChat && selectedChat._id === room) {
        setIsTyping(false);
      }
    });

    socket.on("chat updated", (updatedChat) => {
      setChats((prev) => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
      if (selectedChat && selectedChat._id === updatedChat._id) {
        setSelectedChat(updatedChat);
      }
    });

    socket.on("chat deleted", (deletedChatData) => {
      const deletedChatId = deletedChatData.chatId || deletedChatData._id;
      setChats((prev) => prev.filter((c) => c._id !== deletedChatId));
      if (selectedChat && selectedChat._id === deletedChatId) {
        setSelectedChat(null);
        setMessages([]);
      }
    });

    return () => {
      socket.off("message received");
      socket.off("message updated");
      socket.off("message deleted");
      socket.off("message delivered");
      socket.off("message seen");
      socket.off("typing");
      socket.off("stop typing");
      socket.off("chat updated");
      socket.off("chat deleted");
    };
  }, [selectedChat]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage && selectedChat && !isSending) {
      setIsSending(true);
      socket.emit("stop typing", selectedChat._id);
      try {
        const res = await axiosInstance.post("/api/messages", {
          content: newMessage,
          chatId: selectedChat._id,
          replyTo: replyingTo?._id,
        });
        socket.emit("new message", res.data);
        setMessages([...messages, res.data]);
        setNewMessage("");
        setReplyingTo(null);
        fetchChats(); // Update latest message
      } catch (err) {
        console.error("Error sending message", err);
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await axiosInstance.post("/api/messages/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const res = await axiosInstance.post("/api/messages", {
        content: "",
        attachments: [
                        {
                          url: uploadRes.data.url,
                          publicId: uploadRes.data.publicId,
                          resourceType: uploadRes.data.resourceType,
                        },
                      ],
        chatId: selectedChat._id,
        replyTo: replyingTo?._id,
      });

      socket.emit("new message", res.data);
      setMessages([...messages, res.data]);
      setReplyingTo(null);
      fetchChats();
    } catch (err) {
      console.error("Error uploading file", err);
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    // Insecure contexts (HTTP) do not support media devices on laptop browsers
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Microphone access is unavailable. Modern browsers require a secure HTTPS connection or localhost to record audio. Please verify your connection or SSL settings.");
      return;
    }

    try {
      let stream: MediaStream;
      try {
        // Attempt premium audio quality with echo cancellation and noise suppression
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
      } catch (constraintErr) {
        console.warn("Advanced mic constraints rejected by hardware, falling back to basic audio.", constraintErr);
        // Fallback for strict microphones (like built-in laptop hardware)
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      // Check supported recording formats on laptop/mobile to ensure compatibility
      let options = {};
      const codecs = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/aac",
        "audio/wav"
      ];
      for (const mime of codecs) {
        if (MediaRecorder.isTypeSupported(mime)) {
          options = { mimeType: mime };
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording natively with standard event delivery
      mediaRecorder.start(500);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Microphone access denied or unavailable. Please check your system settings and browser permissions.");
    }
  };

  const stopRecording = (send: boolean) => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = async () => {
        if (send && audioChunksRef.current.length > 0) {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
          
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const file = new File([audioBlob], `voiceNote.${ext}`, { type: mimeType });
          
          setIsUploading(true);
          const formData = new FormData();
          formData.append("file", file);

          try {
            const uploadRes = await axiosInstance.post("/api/messages/upload", formData, {
              headers: { "Content-Type": "multipart/form-data" }
            });

            const res = await axiosInstance.post("/api/messages", {
              content: "",
              voiceNote: uploadRes.data.url,
              voiceNotePublicId: uploadRes.data.publicId,
              chatId: selectedChat._id,
              replyTo: replyingTo?._id,
            });

            socket.emit("new message", res.data);
            setMessages((prev) => [...prev, res.data]);
            setReplyingTo(null);
            fetchChats();
          } catch (err) {
            console.error("Error sending voice note", err);
          } finally {
            setIsUploading(false);
          }
        }
        
        // Stop all tracks to release mic
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;
    if (selectedChat.isGroup) return; // Only allow one-to-one chats
    
    const otherUser = selectedChat.users.find((u: any) => u._id !== user?._id);
    if (!window.confirm(`Are you sure you want to permanently delete this entire chat with ${otherUser?.name || 'this user'}? This will delete all messages for both of you.`)) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/chats/${selectedChat._id}`);
      
      // Emit socket event so it updates for the other user instantly
      if (socket) {
        socket.emit("chat deleted", {
          chatId: selectedChat._id,
          users: selectedChat.users
        });
      }

      // Update local state
      setChats((prev) => prev.filter((c) => c._id !== selectedChat._id));
      setSelectedChat(null);
      setMessages([]);
      setShowInfoPanel(false);
    } catch (err) {
      console.error("Failed to delete chat", err);
      alert("Failed to delete chat. Please try again.");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      const res = await axiosInstance.delete(`/api/messages/${messageId}`);
      setMessages(messages.map(m => m._id === messageId ? res.data : m));
      socket.emit("message deleted", res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditMessage = async (e: React.FormEvent, messageId: string) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.put(`/api/messages/${messageId}`, { content: editMessageText });
      setMessages(messages.map(m => m._id === messageId ? res.data : m));
      socket.emit("message updated", res.data);
      setEditingMessage(null);
      setEditMessageText("");
    } catch (err) {
      console.error(err);
    }
  };

  const handlePinMessage = async (messageId: string) => {
    try {
      const res = await axiosInstance.post(`/api/messages/${messageId}/pin`);
      setSelectedChat(res.data);
      setChats(chats.map(c => c._id === res.data._id ? res.data : c));
      socket.emit("chat updated", res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const res = await axiosInstance.post(`/api/messages/${messageId}/react`, { emoji });
      setMessages(messages.map(m => m._id === messageId ? res.data : m));
      socket.emit("message updated", res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const typingHandler = (e: any) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      socket.emit("stop typing", selectedChat._id);
      setTyping(false);
    }, 3000);
  };

  // Filter active chats based on search query
  const filteredChats = chats.filter((chat) => {
    if (!userSearchQuery.trim()) return true;
    const otherUser = chat.users.find((u: any) => u._id !== user?._id);
    return otherUser?.name?.toLowerCase().includes(userSearchQuery.toLowerCase());
  });

  // Extract mutually connected users from connections
  const connectedUsers = connections.map((conn) => {
    if (!conn) return null;
    return conn.requester?._id === user?._id ? conn.recipient : conn.requester;
  }).filter(Boolean);

  // Exclude connections with whom we already have a chat
  const connectionsWithoutChat = connectedUsers.filter((connUser) => {
    if (!connUser) return false;
    const hasChat = chats.some(
      (chat) => !chat.isGroupChat && chat.users.some((u: any) => u._id === connUser._id)
    );
    return !hasChat;
  });

  // Filter connections based on search query
  const filteredConnections = connectionsWithoutChat.filter((connUser) => {
    if (!userSearchQuery.trim()) return false;
    return connUser.name?.toLowerCase().includes(userSearchQuery.toLowerCase());
  });

  if (user?.role === "admin") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <ShieldAlert size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          Admins are not permitted to use the direct messaging feature.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed top-[64px] bottom-0 left-0 right-0 flex bg-gray-50 dark:bg-slate-900 pt-2 sm:pt-4 pb-2 sm:pb-4 transition-colors">
      <div className="max-w-7xl mx-auto w-full px-0 sm:px-4 flex gap-0 md:gap-6 h-full">

        {/* Left Sidebar - Contacts list */}
        <div className={`w-full md:w-1/3 bg-white dark:bg-slate-800 rounded-none sm:rounded-2xl shadow-sm border-0 sm:border border-gray-100 dark:border-slate-700 flex-col overflow-hidden transition-colors ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Messages</h2>
            <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-2 rounded-xl flex items-center border border-gray-200 dark:border-slate-600">
              <Search size={18} className="text-gray-400 mr-2" />
              <input
                type="text"
                id="searchUsers"
                name="searchUsers"
                placeholder="Search chats or connected users..."
                className="w-full bg-transparent text-gray-900 dark:text-white outline-none text-sm placeholder-gray-400 dark:placeholder-gray-500"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
              {userSearchQuery && (
                <button
                  onClick={() => setUserSearchQuery("")}
                  className="text-xs font-semibold text-gray-400 hover:text-indigo-600 px-1 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {!userSearchQuery.trim() ? (
              // Normal state: show all active chats
              <>
                {chats.map(chat => {
                  const otherUser = chat.users.find((u: any) => u._id !== user?._id);
                  const isOnline = onlineUsers.includes(otherUser?._id);
                  
                  return (
                    <div 
                      key={chat._id} 
                      onClick={() => setSelectedChat(chat)}
                      className={`p-4 border-b border-gray-50 dark:border-slate-700/50 flex items-center cursor-pointer transition-all hover:translate-x-1 ${selectedChat?._id === chat._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-l-indigo-600' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                    >
                      <div className="relative">
                        <img src={otherUser?.profileImage || `https://ui-avatars.com/api/?name=${otherUser?.name}&background=random`} alt={otherUser?.name} className="w-12 h-12 rounded-full mr-4 border border-gray-200 dark:border-slate-700" />
                        {isOnline && <div className="absolute bottom-0 right-4 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{otherUser?.name}</h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {chat.latestMessage ? new Date(chat.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{chat.latestMessage?.isDeleted ? "🚫 This message was deleted" : chat.latestMessage?.content || "No messages yet"}</p>
                      </div>
                      {chat.unreadCount > 0 && (
                        <div className="ml-3 bg-indigo-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {chats.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-sm font-medium">No active chats yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Search for your connected users in the search bar above to start a chat!</p>
                  </div>
                )}
              </>
            ) : (
              // Search state
              <div className="flex flex-col h-full">
                {/* Active Chats Section */}
                {filteredChats.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase px-4 py-2 bg-gray-50 dark:bg-slate-700/30">
                      Active Chats ({filteredChats.length})
                    </div>
                    {filteredChats.map(chat => {
                      const otherUser = chat.users.find((u: any) => u._id !== user?._id);
                      const isOnline = onlineUsers.includes(otherUser?._id);
                      
                      return (
                        <div 
                          key={chat._id} 
                          onClick={() => {
                            setSelectedChat(chat);
                            setUserSearchQuery("");
                          }}
                          className={`p-4 border-b border-gray-50 dark:border-slate-700/50 flex items-center cursor-pointer transition-all hover:translate-x-1 ${selectedChat?._id === chat._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-l-indigo-600' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                        >
                          <div className="relative">
                            <img src={otherUser?.profileImage || `https://ui-avatars.com/api/?name=${otherUser?.name}&background=random`} alt={otherUser?.name} className="w-12 h-12 rounded-full mr-4 border border-gray-200 dark:border-slate-700" />
                            {isOnline && <div className="absolute bottom-0 right-4 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{otherUser?.name}</h3>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {chat.latestMessage ? new Date(chat.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{chat.latestMessage?.isDeleted ? "🚫 This message was deleted" : chat.latestMessage?.content || "No messages yet"}</p>
                          </div>
                          {chat.unreadCount > 0 && (
                            <div className="ml-3 bg-indigo-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                              {chat.unreadCount}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Connections Without Chat Section */}
                {filteredConnections.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase px-4 py-2 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700/50">
                      Start New Chat ({filteredConnections.length})
                    </div>
                    {filteredConnections.map(connUser => {
                      const isOnline = onlineUsers.includes(connUser._id);
                      
                      return (
                        <div 
                          key={connUser._id} 
                          onClick={async () => {
                            try {
                              const res = await axiosInstance.post("/api/chats", { userId: connUser._id });
                              const fullChat = res.data;
                              setChats(prev => {
                                if (prev.some(c => c._id === fullChat._id)) return prev;
                                return [fullChat, ...prev];
                              });
                              setSelectedChat(fullChat);
                              setUserSearchQuery("");
                            } catch (err) {
                              console.error("Failed to start chat with connection", err);
                              alert("Failed to start chat. Please try again.");
                            }
                          }}
                          className="p-4 border-b border-gray-50 dark:border-slate-700/50 flex items-center cursor-pointer transition-all hover:translate-x-1 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                        >
                          <div className="relative">
                            <img src={connUser.profileImage || `https://ui-avatars.com/api/?name=${connUser.name}&background=random`} alt={connUser.name} className="w-12 h-12 rounded-full mr-4 border border-gray-200 dark:border-slate-700" />
                            {isOnline && <div className="absolute bottom-0 right-4 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{connUser.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{connUser.headline || "Mutually connected user"}</p>
                          </div>
                          <div className="ml-3 p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {filteredChats.length === 0 && filteredConnections.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-sm font-medium">No results found for "{userSearchQuery}"</p>
                    <p className="text-xs text-gray-400 mt-1">Make sure you are connected with this user or check spelling.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Area - Chat window */}
        {selectedChat ? (
          <>
          <div className={`w-full md:flex-1 bg-white dark:bg-slate-800 rounded-none sm:rounded-2xl shadow-sm border-0 sm:border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden transition-colors ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
            {/* Chat Header */}
            <div className="p-2 sm:p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 z-10 shadow-sm transition-colors shrink-0">
              <div className="flex items-center min-w-0 flex-1">
                <button 
                  className="md:hidden mr-1 sm:mr-2 p-1.5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition shrink-0"
                  onClick={() => setSelectedChat(null)}
                >
                  <ArrowLeft size={18} />
                </button>
                {(() => {
                  const otherUser = selectedChat.users.find((u: any) => u._id !== user?._id);
                  const isOnline = onlineUsers.includes(otherUser?._id);
                  return (
                    <>
                      <img src={otherUser?.profileImage || `https://ui-avatars.com/api/?name=${otherUser?.name}&background=random`} alt={otherUser?.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3 shrink-0 border border-gray-200 dark:border-slate-700" />
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{otherUser?.name}</h3>
                        <p className={`text-[10px] sm:text-xs font-medium ${isOnline ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                          {isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center text-gray-400 relative shrink-0 ml-2">
                {/* Icons - visible >= 300px */}
                <button onClick={() => setShowCallModal('voice')} className="transition p-1.5 sm:p-2 hidden min-[300px]:block hover:text-indigo-600 dark:hover:text-indigo-400">
                  <Phone size={18} />
                </button>
                <button onClick={() => setShowCallModal('video')} className="transition p-1.5 sm:p-2 hidden min-[300px]:block hover:text-indigo-600 dark:hover:text-indigo-400">
                  <Video size={18} />
                </button>
                <button onClick={() => setShowInfoPanel(!showInfoPanel)} className={`transition p-1.5 sm:p-2 hidden min-[300px]:block ${showInfoPanel ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-full' : 'hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
                  <Info size={18} />
                </button>
                <button onClick={() => setShowSearch(!showSearch)} className={`transition p-1.5 sm:p-2 hidden min-[300px]:block ${showSearch ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-full' : 'hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
                  <Search size={18} />
                </button>
                
                {/* 3-dot Menu - visible < 300px */}
                <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} className={`transition p-1.5 hover:text-indigo-600 min-[300px]:hidden`}>
                  <MoreVertical size={18} />
                </button>
                
                {/* Dropdown for < 300px */}
                {showHeaderMenu && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 z-50 py-1 min-[300px]:hidden overflow-hidden">
                    <button onClick={() => { setShowSearch(!showSearch); setShowHeaderMenu(false); }} className="w-full px-4 py-2.5 text-left flex items-center hover:bg-gray-50 dark:hover:bg-slate-700 text-sm">
                      <Search size={14} className="mr-2 text-gray-400" /> Search
                    </button>
                    <button onClick={() => { setShowCallModal('voice'); setShowHeaderMenu(false); }} className="w-full px-4 py-2.5 text-left flex items-center hover:bg-gray-50 dark:hover:bg-slate-700 text-sm">
                      <Phone size={14} className="mr-2 text-gray-400" /> Voice Call
                    </button>
                    <button onClick={() => { setShowCallModal('video'); setShowHeaderMenu(false); }} className="w-full px-4 py-2.5 text-left flex items-center hover:bg-gray-50 dark:hover:bg-slate-700 text-sm">
                      <Video size={14} className="mr-2 text-gray-400" /> Video Call
                    </button>
                    <button onClick={() => { setShowInfoPanel(!showInfoPanel); setShowHeaderMenu(false); }} className="w-full px-4 py-2.5 text-left flex items-center hover:bg-gray-50 dark:hover:bg-slate-700 text-sm">
                      <Info size={14} className="mr-2 text-gray-400" /> Details
                    </button>
                    {!selectedChat?.isGroup && (
                      <>
                        <div className="h-px bg-gray-100 dark:bg-slate-700 my-1"></div>
                        <button onClick={() => { handleDeleteChat(); setShowHeaderMenu(false); }} className="w-full px-4 py-2.5 text-left flex items-center hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-semibold">
                          <Trash2 size={14} className="mr-2 text-red-400" /> Delete Chat
                        </button>
                      </>
                    )}
                  </div>
                )}
                {/* Search Popup */}
                {showSearch && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowSearch(false); }}></div>
                    <div className="absolute right-0 top-full mt-2 w-56 min-[300px]:w-64 sm:w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 z-50 overflow-hidden">
                      <div className="p-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex items-center">
                        <Search size={16} className="text-gray-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        id="searchMessages"
                        name="searchMessages"
                        placeholder="Search messages..."
                        className="w-full bg-transparent text-gray-900 dark:text-white outline-none text-sm placeholder-gray-400 dark:placeholder-gray-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2">
                      {searchQuery.trim() === "" ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">Type to search in this chat</p>
                      ) : searchResults.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No results found for "{searchQuery}"</p>
                      ) : (
                        <div className="space-y-1">
                          {searchResults.map((m, i) => (
                            <div key={i} className="p-2 bg-white dark:bg-slate-800 rounded border border-transparent cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-100 dark:hover:border-indigo-800/50 transition" onClick={() => {
                              const el = document.getElementById(`message-${m._id}`);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                el.classList.add('bg-indigo-100');
                                setTimeout(() => el.classList.remove('bg-indigo-100'), 2000);
                              }
                              setShowSearch(false);
                            }}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate">{m.sender?.name}</span>
                                <span className="text-[9px] text-gray-400 dark:text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-gray-800 dark:text-gray-300 line-clamp-2">{m.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
                )}
              </div>
            </div>

            {/* Pinned Messages Banner */}
            {selectedChat.pinnedMessages && selectedChat.pinnedMessages.length > 0 && (
              <div 
                className="bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-800/50 p-2 px-4 flex items-center justify-between text-sm shadow-sm cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition shrink-0"
                onClick={() => {
                  const el = document.getElementById(`message-${selectedChat.pinnedMessages[0]}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('bg-indigo-200');
                    setTimeout(() => el.classList.remove('bg-indigo-200'), 2000);
                  }
                }}
              >
                 <div className="flex items-center text-indigo-700 dark:text-indigo-400 w-full">
                   <span className="mr-2">📌</span>
                   <span className="font-semibold mr-2">Pinned:</span>
                   <span className="truncate max-w-sm text-indigo-600 dark:text-indigo-400">{selectedChat.pinnedMessages.length} message(s) pinned in this chat (Click to view)</span>
                 </div>
              </div>
            )}

            {/* Messages Area */}
            <div ref={messagesContainerRef} className="flex-1 min-h-0 p-6 overflow-y-auto bg-gray-50/50 dark:bg-slate-900 flex flex-col space-y-4 transition-colors">
              {messages.map((m, i) => {
                const isMe = m.sender?._id === user?._id;
                const isPinned = selectedChat.pinnedMessages?.includes(m._id);
                return (
                  <div id={`message-${m._id}`} key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`} onMouseEnter={() => setHoveredMessage(m._id)} onMouseLeave={() => setHoveredMessage(null)}>
                    <div className={`group max-w-[90%] sm:max-w-[70%] flex items-end space-x-1 sm:space-x-2 relative ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                      {!isMe && <img src={m.sender?.profileImage || `https://ui-avatars.com/api/?name=${m.sender?.name}&background=random`} alt="" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mb-1 shrink-0" />}
                      
                      <div className={`p-3 rounded-2xl relative group shadow-sm border ${isMe ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-gray-900 dark:text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-bl-none'} ${m.isDeleted ? 'opacity-70 italic' : ''}`}>

                        {m.replyTo && !m.isDeleted && (
                          <div 
                            className={`mb-2 p-2 rounded text-xs border-l-4 cursor-pointer hover:opacity-80 transition ${isMe ? 'bg-indigo-200/50 dark:bg-indigo-800/50 border-indigo-400 dark:border-indigo-500' : 'bg-gray-100 dark:bg-slate-700 border-gray-400 dark:border-slate-500'}`}
                            onClick={() => {
                              const el = document.getElementById(`message-${m.replyTo._id}`);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                el.classList.add('bg-indigo-100');
                                setTimeout(() => el.classList.remove('bg-indigo-100'), 2000);
                              }
                            }}
                          >
                            <p className="font-bold mb-1 opacity-80">{m.replyTo.sender?.name}</p>
                            <p className="opacity-90 truncate max-w-[200px]">{m.replyTo.content || "Attachment"}</p>
                          </div>
                        )}

                        {m.attachments?.length > 0 && !m.isDeleted && (
                          <div className="space-y-2 mb-2">
                            {m.attachments.map((attachment: any, idx: number) => {
                              const isAudio = attachment.resourceType === 'video' && attachment.url.match(/\.(mp3|wav|ogg|m4a|aac|wma)($|\.)/i);
                              const fileName = attachment.publicId ? attachment.publicId.split('/').pop().split('-').slice(1).join('-') : "Audio file";
                              return (
                                <div key={idx}>
                                  {attachment.resourceType === 'image' ? (
                                    <img src={attachment.url} alt="attachment" className="max-w-[130px] min-[300px]:max-w-[160px] sm:max-w-[200px] rounded-lg cursor-pointer hover:opacity-90 transition shadow-sm" onClick={() => window.open(attachment.url, '_blank')} />
                                  ) : isAudio ? (
                                    <div className={`flex flex-col p-2 sm:p-3 rounded-xl border w-max max-w-full shadow-sm ${isMe ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800/50' : 'bg-gray-50 dark:bg-slate-700/50 border-gray-100 dark:border-slate-600'}`}>
                                      <div className="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 px-1">
                                        <div className={`p-1.5 rounded-lg mr-2 shrink-0 ${isMe ? 'bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400' : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-400'}`}>
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                                        </div>
                                        <span className="truncate max-w-[130px] sm:max-w-[180px]">{fileName}</span>
                                      </div>
                                      <audio src={attachment.url} controls className="w-[220px] min-[360px]:w-[245px] sm:w-[280px] h-[35px] outline-none" />
                                    </div>
                                  ) : attachment.resourceType === 'video' ? (
                                    <video src={attachment.url} controls className="max-w-[130px] min-[300px]:max-w-[160px] sm:max-w-[200px] rounded-lg shadow-sm" />
                                  ) : (
                                    <a href={attachment.url} target="_blank" rel="noreferrer" className="flex items-center text-sm underline font-medium">
                                      <Paperclip size={14} className="mr-1" /> View File
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {m.voiceNote && !m.isDeleted && (
                          <div className={`mb-2 rounded-full px-1 sm:px-2 py-1 flex items-center shadow-sm border overflow-hidden w-max max-w-full ${isMe ? 'bg-indigo-500 border-indigo-400' : 'bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600'}`}>
                            <audio controls src={m.voiceNote.replace(/\.[^.]+$/, '.mp3')} className="w-[220px] min-[360px]:w-[245px] sm:w-[280px] h-[35px] outline-none bg-transparent" />
                          </div>
                        )}

                        {editingMessage === m._id ? (
                          <form onSubmit={(e) => handleEditMessage(e, m._id)} className="flex items-center space-x-2">
                            <input type="text" id={`editMessage-${m._id}`} name={`editMessage-${m._id}`} value={editMessageText} onChange={(e) => setEditMessageText(e.target.value)} className="px-2 py-1 text-gray-900 dark:text-white bg-white dark:bg-slate-600 rounded border border-gray-300 dark:border-slate-500 text-sm focus:outline-none" autoFocus />
                            <button type="submit" className={`text-xs px-2 py-1 rounded ${isMe ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'}`}>Save</button>
                            <button type="button" onClick={() => setEditingMessage(null)} className="text-xs opacity-75">Cancel</button>
                          </form>
                        ) : (
                          <p className="text-sm leading-relaxed">
                            {m.isDeleted ? "🚫 This message was deleted" : m.content}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-1 min-w-[80px]">
                          <div className="flex space-x-1">
                            {m.reactions && m.reactions.map((r: any, idx: number) => (
                              <span key={idx} className="text-xs bg-black/10 rounded px-1">{r.emoji}</span>
                            ))}
                          </div>
                          <div className="flex items-center space-x-1 ml-3">
                            {isPinned && <Pin size={10} className="text-indigo-400 mr-1" />}
                            {m.isEdited && !m.isDeleted && <span className={`text-[9px] ${isMe ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400'}`}>(edited)</span>}
                            <p className={`text-[10px] ${isMe ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400'}`}>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {isMe && !m.isDeleted && (
                              <span className="text-[10px] ml-1">
                                {m.readBy?.length > 1 ? (
                                  <span className="text-blue-600 dark:text-blue-400 font-bold">✓✓</span>
                                ) : m.deliveredTo?.length > 0 ? (
                                  <span className="text-gray-500 dark:text-gray-400 font-bold">✓✓</span>
                                ) : (
                                  <span className="text-gray-500 dark:text-gray-400 font-bold">✓</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Hover Actions Menu outside bubble, dropdown overlapping bubble */}
                      {(hoveredMessage === m._id || actionMenuOpen === m._id) && !m.isDeleted && (
                        <div 
                          className={`absolute top-0 flex flex-col ${isMe ? 'items-end right-full mr-2' : 'items-start left-full ml-2'} z-20 transition-opacity`}
                        >
                          <button 
                            className={`p-1 rounded-full shadow-sm border border-gray-100 dark:border-slate-700 transition ${actionMenuOpen === m._id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                            onClick={(e) => { e.stopPropagation(); setActionMenuOpen(actionMenuOpen === m._id ? null : m._id); }}
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {actionMenuOpen === m._id && (
                            <>
                              <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setActionMenuOpen(null); }}></div>
                              <div className={`absolute top-8 ${isMe ? 'left-0' : 'right-0'} flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-xl py-1 text-gray-700 dark:text-gray-300 w-36 overflow-hidden z-30`}>
                              <div className="flex justify-around px-2 py-1.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                                <button onClick={() => { handleReaction(m._id, "👍"); setActionMenuOpen(null); }} className="hover:scale-125 transition">👍</button>
                                <button onClick={() => { handleReaction(m._id, "❤️"); setActionMenuOpen(null); }} className="hover:scale-125 transition">❤️</button>
                                <button onClick={() => { handleReaction(m._id, "😂"); setActionMenuOpen(null); }} className="hover:scale-125 transition">😂</button>
                              </div>
                              <button onClick={() => { setReplyingTo(m); setActionMenuOpen(null); }} className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition">
                                <CornerUpLeft size={14} className="mr-2 text-gray-400 dark:text-gray-500" /> Reply
                              </button>
                              <button onClick={() => { handlePinMessage(m._id); setActionMenuOpen(null); }} className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition">
                                {isPinned ? <><PinOff size={14} className="mr-2 text-indigo-500 dark:text-indigo-400" /> Unpin</> : <><Pin size={14} className="mr-2 text-gray-400 dark:text-gray-500" /> Pin</>}
                              </button>
                              {isMe && (
                                <>
                                  <button onClick={() => { setEditingMessage(m._id); setEditMessageText(m.content); setActionMenuOpen(null); }} className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-50 text-gray-600 transition">
                                    <Edit2 size={14} className="mr-2 text-gray-400" /> Edit
                                  </button>
                                  <div className="h-px bg-gray-100 my-1"></div>
                                  <button onClick={() => { handleDeleteMessage(m._id); setActionMenuOpen(null); }} className="flex items-center w-full px-3 py-2 text-sm hover:bg-red-50 text-red-600 transition">
                                    <Trash2 size={14} className="mr-2 text-red-400" /> Delete
                                  </button>
                                </>
                              )}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center gap-1 shadow-sm w-16">
                    <div className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

              {/* Input Area */}
              <div className="bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors shrink-0">
                {replyingTo && (
                  <div className="bg-gray-50 dark:bg-slate-700/50 px-2 sm:px-4 py-2 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <div className="text-xs sm:text-sm min-w-0">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Replying to {replyingTo.sender.name}</span>
                      <p className="text-gray-500 dark:text-gray-400 truncate max-w-[150px] sm:max-w-xs">{replyingTo.content}</p>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                <div className="p-2 sm:p-4">
                  {smartReplies.length > 0 && newMessage.length === 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-2">
                      <div className="flex items-center text-indigo-500 dark:text-indigo-400 text-xs font-medium mr-1 shrink-0">
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
                          className="shrink-0 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium px-3 py-1.5 rounded-full transition-colors border border-indigo-100 dark:border-indigo-800/50"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                  {isRecording ? (
                    <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-full px-3 sm:px-6 py-2 sm:py-3 border border-red-100 dark:border-red-900/50">
                      <div className="flex items-center text-red-500 dark:text-red-400 font-medium text-xs sm:text-base min-w-0">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse mr-2 shrink-0"></div>
                        <span className="truncate">Rec... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex space-x-1 sm:space-x-3 text-xs sm:text-sm shrink-0">
                        <button type="button" onClick={() => stopRecording(false)} disabled={isUploading} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium px-2 py-1 disabled:opacity-50">Cancel</button>
                        <button type="button" onClick={() => stopRecording(true)} disabled={isUploading} className="bg-red-500 hover:bg-red-600 text-white rounded-full px-3 sm:px-5 py-1 sm:py-1.5 transition shadow-sm font-medium disabled:opacity-50 flex items-center justify-center">
                          {isUploading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                          {isUploading ? "Sending..." : "Send"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={sendMessage} className="flex items-center gap-0.5 sm:gap-2">
                      <input 
                        type="file" 
                        id="chatFileUpload"
                        name="chatFileUpload"
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload} 
                      />
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0 disabled:opacity-50 flex items-center justify-center"
                        title={isUploading ? 'Uploading file...' : 'Attach file'}
                      >
                        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                      </button>
                      
                      <input
                        type="text"
                        id="chatMessageInput"
                        name="chatMessageInput"
                        placeholder="Message..."
                        className="flex-1 ml-0.5 sm:ml-2 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-full px-3 sm:px-6 py-2 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 transition-all text-xs sm:text-sm min-w-[60px] placeholder-gray-400 dark:placeholder-gray-500"
                        value={newMessage}
                        onChange={typingHandler}
                      />
                      
                      <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0 relative">
                        <Smile size={18} />
                        {showEmojiPicker && (
                          <>
                            <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(false); }}></div>
                            <div className="absolute bottom-full right-[-60px] min-[300px]:right-0 mb-2 z-50 overflow-hidden rounded-lg shadow-lg" style={{ width: '280px', maxWidth: 'calc(100vw - 20px)' }}>
                              <EmojiPicker 
                                onEmojiClick={(emojiData, event) => {
                                  event.stopPropagation();
                                  setNewMessage(prev => prev + emojiData.emoji);
                                }} 
                                width="100%"
                                height={350} 
                              />
                            </div>
                          </>
                        )}
                      </button>
                      
                      {newMessage.length === 0 && !isUploading && (
                        <button type="button" onClick={startRecording} className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition shrink-0">
                          <Mic size={18} />
                        </button>
                      )}
                      
                      <button 
                        type="submit" 
                        disabled={!newMessage.trim() || isSending}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 sm:px-5 sm:py-2 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center shrink-0 ml-1"
                      >
                        {isSending ? <Loader2 size={16} className="animate-spin sm:mr-1" /> : <Send size={16} className="sm:mr-1" />}
                        <span className="hidden sm:inline font-medium">{isSending ? 'Sending...' : 'Send'}</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex-col items-center justify-center transition-colors">
            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
              <Search size={40} className="text-indigo-300 dark:text-indigo-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a Conversation</h2>
            <p className="text-gray-500 dark:text-gray-400">Choose a contact from the left menu to start chatting</p>
          </div>
        )}

      </div>

      {/* Call Modal Overlay */}
      {showCallModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
              <img 
                src={selectedChat?.isGroup ? selectedChat?.groupImage || `https://ui-avatars.com/api/?name=${selectedChat?.chatName}&background=random` : selectedChat?.users.find((u: any) => u._id !== user?._id)?.profileImage || `https://ui-avatars.com/api/?name=${selectedChat?.users.find((u: any) => u._id !== user?._id)?.name}&background=random`} 
                alt="Profile" 
                className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-lg relative z-10" 
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 text-center">
              {selectedChat?.isGroup ? selectedChat.chatName : selectedChat?.users.find((u: any) => u._id !== user?._id)?.name}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{showCallModal === 'video' ? 'Calling (Video)...' : 'Calling (Audio)...'}</p>
            
            <div className="flex gap-4">
              {showCallModal === 'video' && (
                <button className="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition">
                  <Video size={24} />
                </button>
              )}
              <button className="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition">
                <Mic size={24} />
              </button>
              <button onClick={() => setShowCallModal(null)} className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition shadow-md shadow-red-200">
                <Phone size={24} className="rotate-[135deg]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel Overlay */}
      {showInfoPanel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowInfoPanel(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-indigo-600 dark:bg-indigo-700 h-24 relative">
              <button onClick={() => setShowInfoPanel(false)} className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="px-6 pb-6 relative">
              <div className="flex justify-center -mt-12 mb-4">
                <img 
                  src={selectedChat?.isGroup ? selectedChat?.groupImage || `https://ui-avatars.com/api/?name=${selectedChat?.chatName}&background=random` : selectedChat?.users.find((u: any) => u._id !== user?._id)?.profileImage || `https://ui-avatars.com/api/?name=${selectedChat?.users.find((u: any) => u._id !== user?._id)?.name}&background=random`} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-md bg-white dark:bg-slate-800" 
                />
              </div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedChat?.isGroup ? selectedChat.chatName : selectedChat?.users.find((u: any) => u._id !== user?._id)?.name}
                </h3>
                {!selectedChat?.isGroup && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedChat?.users.find((u: any) => u._id !== user?._id)?.email || "No email available"}</p>
                )}
                {selectedChat?.isGroup && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedChat?.users.length} members</p>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3 shrink-0">
                    <Search size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">Search in Chat</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-words leading-tight mt-0.5">Find messages or links</p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition min-w-0">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mr-3 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">Starred Messages</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-words leading-tight mt-0.5">View saved messages</p>
                  </div>
                </div>
                {!selectedChat?.isGroup && (
                  <div 
                    onClick={handleDeleteChat} 
                    className="bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl p-3 flex items-center cursor-pointer transition min-w-0 border border-red-100/50 dark:border-red-900/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center mr-3 shrink-0">
                      <Trash2 size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-red-600 dark:text-red-400 truncate">Delete Chat</h4>
                      <p className="text-xs text-red-500 dark:text-red-400 break-words leading-tight mt-0.5">Permanently delete for both</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
