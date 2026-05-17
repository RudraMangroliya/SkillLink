import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // attachments: [{ url: String, publicId: String, resourceType: String }], // url, image/video/raw
    // voiceNote: { type: String, publicId: String }, // url

    attachments: [
      {
        url: { type: String },
        publicId: { type: String },
        resourceType: { type: String },
      },
    ],
    voiceNote: { type: String },
    voiceNotePublicId: { type: String },
    reactions: [{ emoji: String, user: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }],
    isDeleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", MessageSchema);
