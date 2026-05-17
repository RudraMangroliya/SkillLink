import mongoose from "mongoose";

export interface INotification extends mongoose.Document {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  type: "follow" | "connection_request" | "accepted" | "comment" | "group_invite" | "job_match" | "message" | "job_applied" | "job_status_update";
  relatedId?: mongoose.Types.ObjectId;
  message?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["follow", "connection_request", "accepted", "comment", "group_invite", "job_match", "message", "job_applied", "job_status_update"],
      required: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    message: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
