import { Response } from "express";
import { Group } from "../models/Group";
import { GroupDiscussion } from "../models/GroupDiscussion";
import { GroupMessage } from "../models/GroupMessage";

export const createGroup = async (req: any, res: Response) => {
  try {
    const { name, description, category, tags, rules, visibility } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ message: "Name and description are required" });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const group = await Group.create({
      name,
      slug,
      description,
      category: category || "General",
      tags: tags || [],
      rules: rules || [],
      visibility: visibility || "public",
      admin: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json(group);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllGroups = async (req: any, res: Response) => {
  try {
    const groups = await Group.find({
      $or: [
        { visibility: "public" },
        { visibility: { $exists: false } },
        { members: req.user._id }
      ]
    })
      .populate("admin", "name profileImage")
      .populate("members", "name profileImage");
      
    const groupsWithUnread = await Promise.all(groups.map(async (group: any) => {
      const isMember = group.members.some((m: any) => m._id.toString() === req.user._id.toString());
      
      let unreadCount = 0;
      if (isMember) {
        const unreadMessages = await GroupMessage.countDocuments({
          group: group._id,
          readBy: { $ne: req.user._id },
          sender: { $ne: req.user._id }
        });
        
        const unreadPosts = await GroupDiscussion.countDocuments({
          group: group._id,
          readBy: { $ne: req.user._id },
          author: { $ne: req.user._id }
        });
        
        unreadCount = unreadMessages + unreadPosts;
      }
      
      return { ...group.toObject(), unreadCount };
    }));

    res.json(groupsWithUnread);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroupById = async (req: any, res: Response) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("admin", "name profileImage")
      .populate("members", "name profileImage headline");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.visibility === "private" && !group.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "This group is private." });
    }

    const isMember = group.members.some(m => m._id.toString() === req.user._id.toString());
    let unreadPostsCount = 0;
    let unreadMessagesCount = 0;
    
    if (isMember) {
      unreadPostsCount = await GroupDiscussion.countDocuments({
        group: group._id,
        readBy: { $ne: req.user._id },
        author: { $ne: req.user._id }
      });
      unreadMessagesCount = await GroupMessage.countDocuments({
        group: group._id,
        readBy: { $ne: req.user._id },
        sender: { $ne: req.user._id }
      });
    }

    res.json({ ...group.toObject(), unreadPostsCount, unreadMessagesCount });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const joinGroup = async (req: any, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.visibility === "private") {
      return res.status(403).json({ message: "Private group. You must be added by an admin." });
    }

    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ message: "Already a member" });
    }

    group.members.push(req.user._id);
    await group.save();

    res.json({ message: "Successfully joined group", group });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const leaveGroup = async (req: any, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Admin cannot leave the group. Delete it instead." });
    }

    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    await group.save();

    res.json({ message: "Successfully left group", group });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createDiscussion = async (req: any, res: Response) => {
  try {
    const { title, content } = req.body;
    const groupId = req.params.id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Must be a member to post" });
    }

    const discussion = await GroupDiscussion.create({
      group: groupId,
      author: req.user._id,
      title,
      content,
    });

    const populatedDiscussion = await discussion.populate("author", "name profileImage");
    
    // Send notification to all other group members
    const { sendNotification } = require("../utils/notificationUtils");
    for (const memberId of group.members) {
      if (memberId.toString() !== req.user._id.toString()) {
        await sendNotification({
          recipient: memberId,
          sender: req.user._id,
          type: "comment",
          relatedId: group._id.toString(),
          message: `${req.user.name} posted a new discussion in "${group.name}".`
        });
      }
    }

    res.status(201).json(populatedDiscussion);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDiscussions = async (req: any, res: Response) => {
  try {
    const discussions = await GroupDiscussion.find({ group: req.params.id })
      .populate("author", "name profileImage")
      .populate("comments.author", "name profileImage")
      .sort("-createdAt");

    // Mark all fetched discussions as read for the current user
    await GroupDiscussion.updateMany(
      { group: req.params.id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json(discussions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addComment = async (req: any, res: Response) => {
  try {
    const discussionId = req.params.discussionId;
    const { text } = req.body;

    const discussion = await GroupDiscussion.findById(discussionId);
    if (!discussion) return res.status(404).json({ message: "Discussion not found" });

    const group = await Group.findById(discussion.group);
    if (!group || !group.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Must be a member to comment" });
    }

    discussion.comments.push({
      author: req.user._id,
      text,
      createdAt: new Date()
    } as any);

    await discussion.save();
    
    const updatedDiscussion = await GroupDiscussion.findById(discussionId)
      .populate("author", "name profileImage")
      .populate("comments.author", "name profileImage");

    if (discussion.author.toString() !== req.user._id.toString()) {
      const { sendNotification } = require("../utils/notificationUtils");
      await sendNotification({
        recipient: discussion.author,
        sender: req.user._id,
        type: "comment",
        relatedId: discussion.group.toString(),
        message: `${req.user.name} commented on your post "${discussion.title}".`
      });
    }

    res.json(updatedDiscussion);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDiscussion = async (req: any, res: Response) => {
  try {
    const discussionId = req.params.discussionId;
    const discussion = await GroupDiscussion.findById(discussionId);
    
    if (!discussion) return res.status(404).json({ message: "Discussion not found" });

    const group = await Group.findById(discussion.group);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Only author or group admin can delete
    if (discussion.author.toString() !== req.user._id.toString() && group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this discussion" });
    }

    await GroupDiscussion.findByIdAndDelete(discussionId);
    res.json({ message: "Discussion deleted successfully", discussionId });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateGroup = async (req: any, res: Response) => {
  try {
    const { name, description, category, tags, rules, visibility } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can update group" });
    }

    if (name) {
      group.name = name;
      group.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (description) group.description = description;
    if (category) group.category = category;
    if (tags !== undefined) group.tags = tags;
    if (rules !== undefined) group.rules = rules;
    if (visibility) group.visibility = visibility;

    await group.save();
    res.json(group);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteGroup = async (req: any, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can delete group" });
    }

    // Delete related discussions and messages
    await GroupDiscussion.deleteMany({ group: group._id });
    await GroupMessage.deleteMany({ group: group._id });
    await Group.findByIdAndDelete(group._id);

    res.json({ message: "Group deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const removeMember = async (req: any, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);
    const memberId = req.params.userId;

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }
    if (group.admin.toString() === memberId) {
      return res.status(400).json({ message: "Admin cannot remove themselves" });
    }

    group.members = group.members.filter(m => m.toString() !== memberId);
    await group.save();

    res.json({ message: "Member removed successfully", group });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addMember = async (req: any, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);
    const { userId } = req.body;

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can add members manually" });
    }
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (group.members.includes(userId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    group.members.push(userId);
    await group.save();

    const { sendNotification } = require("../utils/notificationUtils");
    await sendNotification({
      recipient: userId,
      sender: req.user._id,
      type: "group_invite",
      relatedId: group._id.toString(),
      message: `${req.user.name} added you to the group "${group.name}".`
    });

    res.json({ message: "Member added successfully", group });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroupMessages = async (req: any, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Verify user is a member
    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Must be a member to view messages" });
    }

    const messages = await GroupMessage.find({ group: group._id })
      .populate("sender", "name profileImage")
      .sort("createdAt"); // Chronological order

    // Mark all fetched messages as read for the current user
    await GroupMessage.updateMany(
      { group: group._id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markGroupMessagesRead = async (req: any, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    await GroupMessage.updateMany(
      { group: group._id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sendGroupMessage = async (req: any, res: Response) => {
  try {
    const { content } = req.body;
    const groupId = req.params.id;

    if (!content) {
      return res.status(400).json({ message: "Message content cannot be empty" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Verify membership
    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Must be a member to send messages" });
    }

    let message = await GroupMessage.create({
      sender: req.user._id,
      content,
      group: groupId,
    });

    message = await message.populate("sender", "name profileImage");
    message = await message.populate("group", "name");

    // Send notification to all other group members
    const { sendNotification } = require("../utils/notificationUtils");
    for (const memberId of group.members) {
      if (memberId.toString() !== req.user._id.toString()) {
        await sendNotification({
          recipient: memberId,
          sender: req.user._id,
          type: "comment",
          relatedId: group._id.toString(),
          message: `${req.user.name} sent a message in "${group.name}".`
        });
      }
    }

    res.json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteGroupMessage = async (req: any, res: Response) => {
  try {
    const message = await GroupMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    message.isDeleted = true;
    message.content = "This message was deleted";
    await message.save();

    const populatedMessage = await GroupMessage.findById(message._id)
      .populate("sender", "name profileImage email");
    res.json(populatedMessage);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const editGroupMessage = async (req: any, res: Response) => {
  try {
    const { content } = req.body;
    const message = await GroupMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this message" });
    }

    message.content = content;
    message.isEdited = true;
    // User request: make message unread when edited
    message.readBy = [req.user._id];
    await message.save();

    const populatedMessage = await GroupMessage.findById(message._id)
      .populate("sender", "name profileImage email");
    res.json(populatedMessage);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const reactToGroupMessage = async (req: any, res: Response) => {
  try {
    const { emoji } = req.body;
    const message = await GroupMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Remove existing reaction from this user if exists
    message.reactions = message.reactions.filter(
      (r: any) => r.user.toString() !== req.user._id.toString()
    ) as any;

    // Add new reaction
    if (emoji) {
      message.reactions.push({ emoji, user: req.user._id } as any);
    }

    await message.save();
    
    const populatedMessage = await GroupMessage.findById(message._id)
      .populate("sender", "name profileImage")
      .populate("reactions.user", "name profileImage");

    res.json(populatedMessage);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const searchGroupMessages = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { q } = req.query;
    if (!q) return res.json([]);

    const messages = await GroupMessage.find({
      group: id,
      content: { $regex: q, $options: "i" },
      isDeleted: false
    })
      .populate("sender", "name profileImage")
      .populate("group", "name");

    res.json(messages);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
