import mongoose from "mongoose";

export interface IGroupMessage extends mongoose.Document {
  sender: mongoose.Types.ObjectId;
  content: string;
  group: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
  deliveredTo: mongoose.Types.ObjectId[];
  attachments: { url: string; resourceType: string }[];
  voiceNote?: string;
  reactions: { emoji: string; user: mongoose.Types.ObjectId }[];
  isDeleted: boolean;
  isEdited: boolean;
  replyTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroupMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    attachments: [{ url: String, resourceType: String }], // url, image/video/raw
    voiceNote: { type: String }, // url
    reactions: [{ emoji: String, user: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }],
    isDeleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "GroupMessage" },
  },
  { timestamps: true }
);

export const GroupMessage = mongoose.model<IGroupMessage>("GroupMessage", GroupMessageSchema);
