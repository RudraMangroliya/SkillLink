import express from "express";
import dotenv from "dotenv";
import dns from "dns";

// Force IPv4 first to fix ENETUNREACH errors with nodemailer on ISPs without IPv6
dns.setDefaultResultOrder("ipv4first");

dotenv.config();

import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import jobRoutes from "./routes/jobs";
import connectionRoutes from "./routes/connections";
import chatRoutes from "./routes/chatRoutes";
import groupRoutes from "./routes/groups";
import messageRoutes from "./routes/messageRoutes";
import recommendationRoutes from "./routes/recommendations";
import notificationRoutes from "./routes/notifications";
import adminRoutes from "./routes/admin";
import { Server } from "socket.io";
import http from "http";

// Connect to MongoDB only if not in test environment
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',') 
  : ["http://localhost:5173", "http://localhost:5174"];

export const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: function (origin: any, callback: any) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Trust proxy so rate limiting works correctly behind Render's load balancer
app.set("trust proxy", 1);

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per `window`
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true, 
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window for auth routes to prevent brute force
  message: { message: "Too many login/register attempts from this IP, please try again after 15 minutes" },
  standardHeaders: true, 
  legacyHeaders: false,
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));
app.use(morgan("dev"));

// Apply global rate limiter to all API routes
app.use("/api", globalLimiter);

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("SkillLink API is running...");
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

const userSockets = new Map<string, Set<string>>();

io.on("connection", (socket) => {
  console.log("Connected to socket.io:", socket.id);

  socket.on("setup", (userData) => {
    if (!userData?._id) return;
    
    socket.join(userData._id);
    
    // Add to online users
    if (!userSockets.has(userData._id)) {
      userSockets.set(userData._id, new Set());
      // Broadcast to everyone that this user is online
      socket.broadcast.emit("user online", userData._id);
    }
    userSockets.get(userData._id)?.add(socket.id);
    
    // Send current online users to this user
    socket.emit("online users", Array.from(userSockets.keys()));
    
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing", room));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing", room));

  socket.on("new message", (newMessageReceived) => {
    var chat = newMessageReceived.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user: any) => {
      if (user._id == newMessageReceived.sender._id) return;

      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  socket.on("message updated", (updatedMessage) => {
    var chat = updatedMessage.chat;
    if (!chat.users) return;
    chat.users.forEach((user: any) => {
      socket.in(user._id).emit("message updated", updatedMessage);
    });
  });

  socket.on("message deleted", (deletedMessage) => {
    var chat = deletedMessage.chat;
    if (!chat.users) return;
    chat.users.forEach((user: any) => {
      socket.in(user._id).emit("message deleted", deletedMessage);
    });
  });

  socket.on("message delivered", (messageData) => {
    if (messageData.chat?.users) {
      messageData.chat.users.forEach((user: any) => {
        socket.in(user._id).emit("message delivered", messageData);
      });
    } else {
      socket.in(messageData.senderId).emit("message delivered", messageData);
    }
  });

  socket.on("chat updated", (updatedChat) => {
    if (!updatedChat.users) return;
    updatedChat.users.forEach((user: any) => {
      socket.in(user._id).emit("chat updated", updatedChat);
    });
  });

  socket.on("chat deleted", (deletedChatData) => {
    if (!deletedChatData.users) return;
    deletedChatData.users.forEach((user: any) => {
      socket.in(user._id || user).emit("chat deleted", deletedChatData);
    });
  });

  socket.on("message seen", (messageData) => {
    if (messageData.chat?.users) {
      messageData.chat.users.forEach((user: any) => {
        socket.in(user._id).emit("message seen", messageData);
      });
    } else {
      socket.in(messageData.senderId).emit("message seen", messageData);
    }
  });

  // Group Chat Socket Events
  socket.on("join group", (groupId) => {
    socket.join(`group:${groupId}`);
    console.log("User Joined Group Room: " + groupId);
  });

  socket.on("leave group", (groupId) => {
    socket.leave(`group:${groupId}`);
    console.log("User Left Group Room: " + groupId);
  });

  socket.on("group typing", (groupId) => socket.in(`group:${groupId}`).emit("group typing", groupId));
  socket.on("stop group typing", (groupId) => socket.in(`group:${groupId}`).emit("stop group typing", groupId));

  socket.on("new group message", (newGroupMessage) => {
    const groupId = newGroupMessage.group._id || newGroupMessage.group;
    socket.in(`group:${groupId}`).emit("group message received", newGroupMessage);
  });

  socket.on("new group discussion", (newPost) => {
    const groupId = newPost.group._id || newPost.group;
    socket.in(`group:${groupId}`).emit("new group discussion", newPost);
  });

  socket.on("group message updated", (updatedGroupMessage) => {
    const groupId = updatedGroupMessage.group._id || updatedGroupMessage.group;
    socket.in(`group:${groupId}`).emit("group message updated", updatedGroupMessage);
  });

  socket.on("group message deleted", (deletedGroupMessage) => {
    const groupId = deletedGroupMessage.group._id || deletedGroupMessage.group;
    socket.in(`group:${groupId}`).emit("group message deleted", deletedGroupMessage);
  });

  socket.on("disconnect", () => {
    for (const [userId, sockets] of userSockets.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          socket.broadcast.emit("user offline", userId);
          console.log("USER DISCONNECTED:", userId);
        }
        break;
      }
    }
  });
});
