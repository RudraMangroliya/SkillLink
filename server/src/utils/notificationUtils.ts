import { Notification } from "../models/Notification";
import { io } from "../index";

interface NotificationData {
  recipient: string;
  sender?: string;
  type: "follow" | "connection_request" | "accepted" | "comment" | "group_invite" | "job_match" | "message" | "job_applied" | "job_status_update";
  relatedId?: string;
  message?: string;
}

export const sendNotification = async (data: NotificationData) => {
  try {
    // Save to database
    const notification = await Notification.create(data);
    
    // Populate sender info for the frontend
    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "name profileImage");

    // Emit via Socket.io to the recipient's personal room
    io.in(data.recipient.toString()).emit("new notification", populatedNotification);

    return populatedNotification;
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
