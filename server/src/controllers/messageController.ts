import { Response } from "express";
import { Message } from "../models/Message";
import { User } from "../models/User";
import { Chat } from "../models/Chat";
import { cloudinary } from "../config/cloudinary";

export const allMessages = async (req: any, res: Response) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name profileImage email")
      .populate("chat")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "name profileImage email" }
      });
    res.json(messages);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const sendMessage = async (req: any, res: Response) => {
  const { content, chatId, attachments, voiceNote, voiceNotePublicId, replyTo } = req.body;

  if (!chatId || (!content && !attachments && !voiceNote)) {
    return res.status(400).json({ message: "Invalid data passed into request" });
  }

  var newMessage: any = {
    sender: req.user._id,
    content: content || "",
    chat: chatId,
    readBy: [req.user._id]
  };

  if (attachments) newMessage.attachments = attachments;
  if (voiceNote) {
    newMessage.voiceNote = voiceNote;
    newMessage.voiceNotePublicId = voiceNotePublicId;
  }
  if (replyTo) newMessage.replyTo = replyTo;

  try {
    var message: any = await Message.create(newMessage);

    message = await message.populate("sender", "name profileImage");
    message = await message.populate("chat");
    message = await message.populate({
      path: "replyTo",
      populate: { path: "sender", select: "name profileImage email" }
    });
    message = await User.populate(message, {
      path: "chat.users",
      select: "name profileImage email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    // Send notification to the other user
    const recipient = message.chat.users.find((u: any) => u._id.toString() !== req.user._id.toString());
    if (recipient) {
      const { sendNotification } = require("../utils/notificationUtils");
      await sendNotification({
        recipient: recipient._id,
        sender: req.user._id,
        type: "message",
        relatedId: req.body.chatId,
        message: `${req.user.name} sent you a message.`
      });
    }

    res.json(message);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const markMessagesAsRead = async (req: any, res: Response) => {
  try {
    const { chatId } = req.body;

    await Message.updateMany(
      { chat: chatId, readBy: { $ne: req.user._id } },
      { $push: { readBy: req.user._id } }
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const markMessagesAsDelivered = async (req: any, res: Response) => {
  try {
    const { chatId } = req.body;

    await Message.updateMany(
      { chat: chatId, deliveredTo: { $ne: req.user._id } },
      { $push: { deliveredTo: req.user._id } }
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMessage = async (req: any, res: Response) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    // const extractPublicId = (url: string) => {
    //   try {
    //     const parts = url.split('/');
    //     const uploadIndex = parts.indexOf('upload');
    //     if (uploadIndex !== -1) {
    //       let afterUpload = parts.slice(uploadIndex + 1);
    //       if (afterUpload[0].match(/^v\d+$/)) {
    //         afterUpload = afterUpload.slice(1);
    //       }
    //       const fileWithExt = afterUpload.join('/');
    //       const lastDotIndex = fileWithExt.lastIndexOf('.');
    //       return lastDotIndex !== -1 ? fileWithExt.substring(0, lastDotIndex) : fileWithExt;
    //     }
    //     return null;
    //   } catch (e) {
    //     return null;
    //   }
    // };

    // const extractRawPublicId = (url: string) => {
    //   try {
    //     const parts = url.split('/');
    //     const uploadIndex = parts.indexOf('upload');
    //     if (uploadIndex !== -1) {
    //       let afterUpload = parts.slice(uploadIndex + 1);
    //       if (afterUpload[0].match(/^v\d+$/)) {
    //         afterUpload = afterUpload.slice(1);
    //       }
    //       return afterUpload.join('/');
    //     }
    //     return null;
    //   } catch (e) {
    //     return null;
    //   }
    // };


    const extractPublicId = (url: string) => {
      try {
        const urlParts = url.split("/upload/");
        if (urlParts.length < 2) return null;

        let publicIdWithVersion = urlParts[1];

        // Remove version like v1749999999/
        publicIdWithVersion = publicIdWithVersion.replace(/^v\d+\//, "");

        // Always remove extension for message attachments because uploadMedia strips it
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

    // Delete voice note from Cloudinary
    if (message.voiceNote) {
      const publicId = message.voiceNotePublicId || extractPublicId(message.voiceNote);
      if (publicId) {
        console.log("Deleting voiceNote:", publicId);
        await cloudinary.uploader.destroy(publicId, { resource_type: "video" }).catch(err => console.error("Cloudinary delete error:", err));
      }
      message.voiceNote = undefined;
      message.voiceNotePublicId = undefined;
    }

    // Delete attachments from Cloudinary
    if (message.attachments && message.attachments.length > 0) {
      for (const attachment of message.attachments as any) {
        // Cloudinary uploadMedia (auto) maps PDFs to 'image' and audio/video to 'video'.
        // It never creates 'raw' assets for messages.
        const resourceType = attachment.resourceType === "video" ? "video" : "image";
        
        const publicId = attachment.publicId || extractPublicId(attachment.url);

        if (!publicId) {
          console.log("No publicId found for attachment:", attachment.url);
          continue;
        }

        console.log("Deleting attachment:", publicId, "type:", resourceType);

        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
        }).catch(err => {
          console.error("Cloudinary delete error:", err);
          return { result: 'error' };
        });

        console.log("Cloudinary Result:", result);
      }

      message.attachments = [] as any;
    }

    message.isDeleted = true;
    message.content = "This message was deleted";
    await message.save();

    let populatedMessage = await Message.findById(message._id)
      .populate("sender", "name profileImage email")
      .populate("chat");
    populatedMessage = await User.populate(populatedMessage, {
      path: "chat.users",
      select: "name profileImage email",
    }) as any;
    res.json(populatedMessage);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const editMessage = async (req: any, res: Response) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this message" });
    }

    message.content = content;
    message.isEdited = true;
    // User request: make message unread when edited
    message.readBy = [req.user._id];
    await message.save();

    let populatedMessage = await Message.findById(message._id)
      .populate("sender", "name profileImage email")
      .populate("chat");
    populatedMessage = await User.populate(populatedMessage, {
      path: "chat.users",
      select: "name profileImage email",
    }) as any;
    res.json(populatedMessage);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const reactToMessage = async (req: any, res: Response) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Check if the user already reacted with this exact emoji
    const existingReaction = message.reactions.find(
      (r: any) => r.user.toString() === req.user._id.toString()
    );

    // Remove existing reaction from this user if exists
    message.reactions = message.reactions.filter(
      (r: any) => r.user.toString() !== req.user._id.toString()
    ) as any;

    // Add new reaction only if it's different from the existing one (toggle behavior)
    if (emoji && (!existingReaction || existingReaction.emoji !== emoji)) {
      message.reactions.push({ emoji, user: req.user._id } as any);
    }

    await message.save();

    let populatedMessage = await Message.findById(message._id)
      .populate("sender", "name profileImage email")
      .populate("chat")
      .populate("reactions.user", "name profileImage email");
    populatedMessage = await User.populate(populatedMessage, {
      path: "chat.users",
      select: "name profileImage email",
    }) as any;
    res.json(populatedMessage);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadAttachment = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileData = {
      url: req.file.path,
      publicId: req.file.filename || req.file.public_id,
      resourceType: req.file.mimetype.startsWith('video/') || req.file.mimetype.startsWith('audio/') ? 'video' :
        req.file.mimetype.startsWith('image/') ? 'image' : 'raw'
    };

    res.json(fileData);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const searchMessages = async (req: any, res: Response) => {
  try {
    const { chatId } = req.params;
    const { q } = req.query;
    if (!q) return res.json([]);

    const messages = await Message.find({
      chat: chatId,
      content: { $regex: q, $options: "i" },
      isDeleted: false
    })
      .populate("sender", "name profileImage")
      .populate("chat")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "name profileImage email" }
      });
    res.json(messages);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const pinMessage = async (req: any, res: Response) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const chat = await Chat.findById(message.chat);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const isPinned = chat.pinnedMessages?.includes(message._id as any);

    if (isPinned) {
      chat.pinnedMessages = chat.pinnedMessages?.filter(id => id.toString() !== message._id.toString()) as any;
    } else {
      if (!chat.pinnedMessages) chat.pinnedMessages = [];
      chat.pinnedMessages.push(message._id as any);
    }

    await chat.save();

    const populatedChat = await Chat.findById(chat._id)
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage");

    res.json(populatedChat);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

