import { Response } from "express";
import { Notification } from "../models/Notification";

export const getNotifications = async (req: any, res: Response) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "name profileImage")
      .sort("-createdAt")
      .limit(50); // Get latest 50 notifications

    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req: any, res: Response) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllAsRead = async (req: any, res: Response) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const clearAllNotifications = async (req: any, res: Response) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    res.json({ message: "All notifications cleared" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
