import { Response } from "express";
import { Chat } from "../models/Chat";
import { User } from "../models/User";
import { Message } from "../models/Message";

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
