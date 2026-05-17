import { cloudinary } from "../config/cloudinary";
import { User } from "../models/User";
import { Profile } from "../models/Profile";
import { Connection } from "../models/Connection";
import { Job } from "../models/Job";
import { Message } from "../models/Message";
import { Chat } from "../models/Chat";
import { Group } from "../models/Group";
import { GroupMessage } from "../models/GroupMessage";
import { GroupDiscussion } from "../models/GroupDiscussion";
import { Notification } from "../models/Notification";

const extractPublicId = (url: string) => {
  try {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return filename.split(".")[0];
  } catch (error) {
    return null;
  }
};

export const deleteUserCompletely = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const profile = await Profile.findOne({ user: userId });

    // 1. Delete user images from Cloudinary
    if (user.profileImage && !user.profileImage.includes("googleusercontent.com")) {
      const publicId = extractPublicId(user.profileImage);
      if (publicId) await cloudinary.uploader.destroy(publicId).catch(() => {});
    }
    if (user.backgroundImage) {
      const publicId = extractPublicId(user.backgroundImage);
      if (publicId) await cloudinary.uploader.destroy(publicId).catch(() => {});
    }
    if (profile && profile.resumeUrl) {
      const publicId = extractPublicId(profile.resumeUrl);
      if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: "raw" }).catch(() => {});
    }

    // 2. Connections & Follows
    await Connection.deleteMany({ $or: [{ requester: userId }, { recipient: userId }] });
    await Profile.updateMany({}, { $pull: { followers: userId, following: userId } });

    // 3. Jobs
    // Delete jobs created by this user
    await Job.deleteMany({ recruiter: userId });
    // Remove user from other job applications and saved lists
    await Job.updateMany({}, { 
      $pull: { 
        applications: { applicant: userId },
        savedBy: userId 
      } 
    });

    // 4. Notifications
    await Notification.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] });

    // 5. 1-on-1 Chats and Messages
    const userChats = await Chat.find({ users: userId });
    const chatIds = userChats.map(c => c._id);
    
    // Find messages in these chats or sent by this user to delete Cloudinary attachments
    const messagesToDelete = await Message.find({ 
      $or: [{ chat: { $in: chatIds } }, { sender: userId }] 
    });

    for (const msg of messagesToDelete) {
      if (msg.voiceNotePublicId) {
        await cloudinary.uploader.destroy(msg.voiceNotePublicId, { resource_type: "video" }).catch(() => {});
      }
      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          if (att.publicId) {
            await cloudinary.uploader.destroy(att.publicId, { resource_type: att.resourceType || "image" }).catch(() => {});
          }
        }
      }
    }
    await Message.deleteMany({ $or: [{ chat: { $in: chatIds } }, { sender: userId }] });
    await Chat.deleteMany({ _id: { $in: chatIds } });

    // Remove user from other message reactions
    await Message.updateMany({}, { $pull: { reactions: { user: userId } } });

    // 6. Groups
    // Delete groups created by this user entirely
    const userGroups = await Group.find({ creator: userId });
    const groupIds = userGroups.map(g => g._id);

    // Delete everything inside these created groups
    await GroupMessage.deleteMany({ group: { $in: groupIds } });
    await GroupDiscussion.deleteMany({ group: { $in: groupIds } });
    await Group.deleteMany({ _id: { $in: groupIds } });

    // Remove user from other groups they joined
    await Group.updateMany({}, {
      $pull: { members: userId, admins: userId, joinRequests: userId }
    });

    // 7. Group Messages & Discussions sent by user in other groups
    const groupMessagesToDelete = await GroupMessage.find({ sender: userId });
    for (const msg of groupMessagesToDelete) {
      // GroupMessage doesn't store publicId explicitly, try extracting from URL
      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          const publicId = extractPublicId(att.url);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId, { resource_type: att.resourceType || "image" }).catch(() => {});
          }
        }
      }
    }
    await GroupMessage.deleteMany({ sender: userId });
    await GroupMessage.updateMany({}, { $pull: { reactions: { user: userId } } });

    // Delete their group discussions and comments
    await GroupDiscussion.deleteMany({ author: userId });
    // Remove their comments from all discussions
    await GroupDiscussion.updateMany({}, { $pull: { comments: { author: userId } } });

    // 8. Delete Profile & User
    if (profile) await Profile.findByIdAndDelete(profile._id);
    await User.findByIdAndDelete(userId);

  } catch (error) {
    console.error("Error in deleteUserCompletely:", error);
    throw error;
  }
};
