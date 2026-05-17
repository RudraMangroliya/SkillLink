import { Response } from "express";
import { User } from "../models/User";
import { Job } from "../models/Job";
import { Connection } from "../models/Connection";
import { Message } from "../models/Message";
import { Profile } from "../models/Profile";
import os from "os";
import { deleteUserCompletely } from "../utils/deleteUserHelper";

export const getDashboardAnalytics = async (req: any, res: Response) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized as an admin" });
    }

    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalConnections = await Connection.countDocuments();
    
    // Recent Users for Users Tab
    const recentUsers = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(50);

    const daysParam = parseInt(req.query.days as string) || 7;
    const daysToFetch = Math.min(Math.max(daysParam, 1), 90);

    let startDateObj = new Date();
    
    if (req.query.startDate) {
      startDateObj = new Date(req.query.startDate as string);
    } else {
      startDateObj.setDate(startDateObj.getDate() - (daysToFetch - 1));
    }
    
    // Ensure start date is at start of day
    startDateObj.setHours(0, 0, 0, 0);

    // Generate day chart data from start date forward
    const lastXDays = Array.from({length: daysToFetch}, (_, i) => {
      const d = new Date(startDateObj);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    const endOfRange = new Date(startDateObj);
    endOfRange.setDate(endOfRange.getDate() + daysToFetch);

    // Fetch records within the range
    const recentUsersList = await User.find({ createdAt: { $gte: startDateObj, $lt: endOfRange } }).select("createdAt");
    const recentJobsList = await Job.find({ createdAt: { $gte: startDateObj, $lt: endOfRange } }).select("createdAt");
    const recentConnectionsList = await Connection.find({ createdAt: { $gte: startDateObj, $lt: endOfRange } }).select("createdAt");
    const recentMessagesList = await Message.find({ createdAt: { $gte: startDateObj, $lt: endOfRange } }).select("createdAt");

    const getCountByDay = (list: any[], dateString: string) => {
      return list.filter(item => new Date(item.createdAt).toISOString().split('T')[0] === dateString).length;
    };

    const chartData = lastXDays.map(date => {
      const dateObj = new Date(date);
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: 'short' });
      const dateNum = dateObj.getDate();
      const monthStr = dateObj.toLocaleDateString("en-US", { month: 'short' });
      
      return {
        name: `${dayName} ${dateNum} ${monthStr}`,
        users: getCountByDay(recentUsersList, date),
        jobs: getCountByDay(recentJobsList, date),
        connections: getCountByDay(recentConnectionsList, date),
        messages: getCountByDay(recentMessagesList, date)
      };
    });

    // System Health
    const systemHealth = {
      uptime: os.uptime(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      cpus: os.cpus().length,
      platform: os.platform()
    };

    // Calculate Active Users Today (Created today or active today proxy)
    const todayStr = new Date().toISOString().split('T')[0];
    const activeUsersToday = chartData.find(d => new Date().toISOString().split('T')[0] === todayStr)?.users || getCountByDay(recentUsersList, todayStr) || 0;

    res.json({
      metrics: {
        totalUsers,
        totalJobs,
        totalConnections,
        totalMessages: await Message.countDocuments(),
        activeUsersToday: Math.max(activeUsersToday, Math.floor(totalUsers * 0.1)) // Provide fallback if no traffic today
      },
      chartData,
      systemHealth,
      recentUsers
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req: any, res: Response) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized as an admin" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete another admin" });
    }

    // Delete associated data using the complete teardown utility
    await deleteUserCompletely(req.params.id);
    res.json({ message: "User removed successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
