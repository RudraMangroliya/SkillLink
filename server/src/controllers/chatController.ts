import { Response } from "express";
import { Chat } from "../models/Chat";
import { User } from "../models/User";
import { Message } from "../models/Message";
import { cloudinary } from "../config/cloudinary";

export const accessChat = async (req: any, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "UserId param not sent with request" });
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name profileImage email",
  }) as any;

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(FullChat);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
};

export const fetchChats = async (req: any, res: Response) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name profileImage email",
        }) as any;

        // Calculate unread counts
        const chatsWithUnread = await Promise.all(
          results.map(async (chat: any) => {
            const unreadCount = await Message.countDocuments({
              chat: chat._id,
              readBy: { $ne: req.user._id },
            });
            return { ...chat.toObject(), unreadCount };
          })
        );

        res.status(200).send(chatsWithUnread);
      });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteChat = async (req: any, res: Response) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Verify authorization
    const isUserInChat = chat.users.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (!isUserInChat) {
      return res.status(403).json({ message: "Not authorized to delete this chat" });
    }

    // Enforce 1-on-1 chats constraint
    if (chat.isGroupChat) {
      return res.status(400).json({ message: "Cannot delete group chats using this endpoint" });
    }

    const extractPublicId = (url: string) => {
      try {
        const urlParts = url.split("/upload/");
        if (urlParts.length < 2) return null;
        let publicIdWithVersion = urlParts[1];
        publicIdWithVersion = publicIdWithVersion.replace(/^v\d+\//, "");
        const lastDot = publicIdWithVersion.lastIndexOf(".");
        if (lastDot !== -1) {
          return publicIdWithVersion.substring(0, lastDot);
        }
        return publicIdWithVersion;
      } catch (err) {
        console.error("Public ID extraction failed:", err);
        return null;
      }
    };

    // Clean up all Cloudinary message assets
    const messages = await Message.find({ chat: chatId });

    for (const msg of messages) {
      // Delete voice notes
      if (msg.voiceNote) {
        const publicId = msg.voiceNotePublicId || extractPublicId(msg.voiceNote);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { resource_type: "video" }).catch((err) =>
            console.error("Cloudinary voiceNote delete error:", err)
          );
        }
      }

      // Delete file attachments
      if (msg.attachments && msg.attachments.length > 0) {
        for (const attachment of msg.attachments as any) {
          const resourceType = attachment.resourceType === "video" ? "video" : "image";
          const publicId = attachment.publicId || extractPublicId(attachment.url);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch((err) =>
              console.error("Cloudinary attachment delete error:", err)
            );
          }
        }
      }
    }

    // Delete messages and chat from database
    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);

    res.status(200).json({ success: true, message: "Chat and all associated messages deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
