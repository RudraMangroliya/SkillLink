import { Response } from "express";
import { Profile } from "../models/Profile";
import { cloudinary } from "../config/cloudinary";
import { User } from "../models/User";

const extractPublicId = (url: string) => {
  if (!url) return null;
  const parts = url.split("/");
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex !== -1 && uploadIndex < parts.length - 1) {
    // The part immediately after 'upload' is usually the version (e.g. v1621234), so we skip it
    // Wait, sometimes version is missing if URL is customized, but CloudinaryStorage usually includes it
    // Let's handle it safely:
    let startIndex = uploadIndex + 1;
    if (parts[startIndex].startsWith('v') && !isNaN(parseInt(parts[startIndex].substring(1)))) {
      startIndex++; // skip version
    }
    const pathParts = parts.slice(startIndex);
    const fullPath = decodeURIComponent(pathParts.join("/"));
    // remove extension
    const lastDotIndex = fullPath.lastIndexOf(".");
    return lastDotIndex !== -1 ? fullPath.substring(0, lastDotIndex) : fullPath;
  }
  return null;
};

export const getMyProfile = async (req: any, res: Response) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id })
      .populate("user", ["name", "email", "profileImage", "backgroundImage"])
      .populate("recommendations.recommender", ["name", "profileImage"])
      .populate("followers", ["name", "profileImage", "headline"])
      .populate("following", ["name", "profileImage", "headline"]);
    
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfileByUserId = async (req: any, res: Response) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId })
      .populate("user", ["name", "email", "profileImage", "backgroundImage", "role"])
      .populate("recommendations.recommender", ["name", "profileImage"])
      .populate("followers", ["name", "profileImage", "headline"])
      .populate("following", ["name", "profileImage", "headline"]);
      
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  } catch (error: any) {
    if (error.kind == "ObjectId") {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getAllProfiles = async (req: any, res: Response) => {
  try {
    let profiles = await Profile.find()
      .populate("user", ["name", "email", "profileImage", "backgroundImage", "role"]);
    
    // Hide admin users globally
    profiles = profiles.filter(p => p.user && (p.user as any).role !== "admin");

    res.json(profiles);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const { name, ...profileData } = req.body;
    const profileFields = { ...profileData, user: req.user._id };

    if (name) {
      await User.findByIdAndUpdate(req.user._id, { name });
    }

    let profile = await Profile.findOne({ user: req.user._id });

    if (profile) {
      profile = await Profile.findOneAndUpdate(
        { user: req.user._id },
        { $set: profileFields },
        { new: true }
      );
      return res.json(profile);
    }

    profile = new Profile(profileFields);
    await profile.save();
    res.status(201).json(profile);

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadResume = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    if (profile.resumeUrl) {
      const url = profile.resumeUrl;
      const parts = url.split("/");
      const uploadIndex = parts.indexOf("upload");
      if (uploadIndex !== -1) {
        let startIndex = uploadIndex + 1;
        if (parts[startIndex].startsWith('v') && !isNaN(parseInt(parts[startIndex].substring(1)))) {
          startIndex++;
        }
        const fullPath = decodeURIComponent(parts.slice(startIndex).join("/"));
        const lastDotIndex = fullPath.lastIndexOf(".");
        const publicIdWithoutExt = lastDotIndex !== -1 ? fullPath.substring(0, lastDotIndex) : fullPath;
        
        // Try destroying both with and without extension, as raw and image
        await cloudinary.uploader.destroy(publicIdWithoutExt, { resource_type: "image" }).catch(() => {});
        await cloudinary.uploader.destroy(publicIdWithoutExt, { resource_type: "raw" }).catch(() => {});
        await cloudinary.uploader.destroy(fullPath, { resource_type: "raw" }).catch(() => {});
        await cloudinary.uploader.destroy(fullPath, { resource_type: "image" }).catch(() => {});
      }
    }

    profile.resumeUrl = req.file.path; // Cloudinary returns URL in path property
    await profile.save();

    res.json({ message: "Resume uploaded successfully", resumeUrl: profile.resumeUrl });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadProfileImage = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Update the User model since profileImage is stored there
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.profileImage) {
      const publicId = extractPublicId(user.profileImage);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch(e => console.log("Cloudinary destroy error:", e));
      }
    }

    user.profileImage = req.file.path;
    await user.save();

    res.json({ message: "Profile image uploaded successfully", profileImage: user.profileImage });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const searchProfiles = async (req: any, res: Response) => {
  try {
    const { keyword, location, experience, skills } = req.query;

    let matchQuery: any = {};

    if (location) {
      matchQuery.location = { $regex: location, $options: "i" };
    }

    if (skills) {
      const skillsArray = (skills as string).split(",").map(s => s.trim());
      matchQuery.skills = { $in: skillsArray.map(s => new RegExp(s, "i")) };
    }

    let profiles = await Profile.find(matchQuery).populate("user", ["name", "email", "profileImage", "backgroundImage", "role"]);

    // Exclude the current user from explore page results, and exclude all admins
    if (req.user && req.user._id) {
      profiles = profiles.filter(p => 
        p.user && 
        (p.user as any)._id.toString() !== req.user._id.toString() &&
        (p.user as any).role !== "admin"
      );
    } else {
      profiles = profiles.filter(p => p.user && (p.user as any).role !== "admin");
    }

    if (keyword) {
      const keywordLower = (keyword as string).toLowerCase();
      profiles = profiles.filter(p => {
        const userName = (p.user as any)?.name?.toLowerCase() || "";
        const matchesName = userName.includes(keywordLower);
        const matchesHeadline = p.headline?.toLowerCase().includes(keywordLower);
        const matchesBio = p.bio?.toLowerCase().includes(keywordLower);
        const matchesLocation = p.location?.toLowerCase().includes(keywordLower);
        
        const matchesSkills = p.skills?.some((s: string) => s.toLowerCase().includes(keywordLower));
        const matchesInterests = p.interests?.some((i: string) => i.toLowerCase().includes(keywordLower));
        
        const matchesExperience = p.experience?.some((e: any) => 
          e.company?.toLowerCase().includes(keywordLower) || 
          e.title?.toLowerCase().includes(keywordLower) ||
          e.description?.toLowerCase().includes(keywordLower)
        );
        
        const matchesEducation = p.education?.some((e: any) => 
          e.institution?.toLowerCase().includes(keywordLower) || 
          e.degree?.toLowerCase().includes(keywordLower) ||
          e.fieldOfStudy?.toLowerCase().includes(keywordLower)
        );

        return matchesName || matchesHeadline || matchesBio || matchesLocation || matchesSkills || matchesInterests || matchesExperience || matchesEducation;
      });
    }

    res.json(profiles);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadBackgroundImage = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const User = require("../models/User").User;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.backgroundImage) {
      const publicId = extractPublicId(user.backgroundImage);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch(e => console.log("Cloudinary destroy error:", e));
      }
    }

    user.backgroundImage = req.file.path;
    await user.save();

    res.json({ message: "Background image uploaded successfully", backgroundImage: user.backgroundImage });
  } catch (error: any) {
    console.error("Upload Background Error:", error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

export const endorseSkill = async (req: any, res: Response) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const { skill } = req.body;
    if (!skill) return res.status(400).json({ message: "Skill is required" });

    let endorsement = profile.endorsements.find((e: any) => e.skill === skill);
    if (!endorsement) {
      profile.endorsements.push({ skill, endorsers: [req.user._id] });
    } else {
      const endorserIndex = endorsement.endorsers.indexOf(req.user._id);
      if (endorserIndex !== -1) {
        endorsement.endorsers.splice(endorserIndex, 1);
      } else {
        endorsement.endorsers.push(req.user._id);
      }
    }
    
    await profile.save();
    
    const updatedProfile = await Profile.findOne({ user: req.params.userId })
      .populate("user", ["name", "email", "profileImage", "backgroundImage", "role"])
      .populate("recommendations.recommender", ["name", "profileImage"]);
      
    res.json(updatedProfile);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addRecommendation = async (req: any, res: Response) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Recommendation text is required" });

    profile.recommendations.push({ text, recommender: req.user._id });
    await profile.save();

    const updatedProfile = await Profile.findOne({ user: req.params.userId })
      .populate("user", ["name", "email", "profileImage", "backgroundImage", "role"])
      .populate("recommendations.recommender", ["name", "profileImage"]);
      
    res.json(updatedProfile);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const generateRecommendationDraft = async (req: any, res: Response) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate("user", ["name"]);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const target_name = (profile.user as any)?.name || "";
    const target_headline = profile.headline || "";
    const target_skills = profile.skills || [];

    const axios = require('axios');
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
    const response = await axios.post(`${AI_SERVICE_URL}/generate-draft`, {
      target_name,
      target_headline,
      target_skills
    });

    res.json({ draft: response.data.draft });
  } catch (error: any) {
    console.error("ML Service Draft Error:", error);
    res.status(500).json({ message: "Failed to generate draft. Please write it manually." });
  }
};

export const followUser = async (req: any, res: Response) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetProfile = await Profile.findOne({ user: targetUserId });
    const currentProfile = await Profile.findOne({ user: currentUserId });

    if (!targetProfile || !currentProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (!targetProfile.followers.some((id: any) => id.toString() === currentUserId.toString())) {
      targetProfile.followers.push(currentUserId);
      await targetProfile.save();
    }

    if (!currentProfile.following.some((id: any) => id.toString() === targetUserId.toString())) {
      currentProfile.following.push(targetUserId);
      await currentProfile.save();
    }

    // Send notification to the followed user
    const { sendNotification } = require("../utils/notificationUtils");
    await sendNotification({
      recipient: targetUserId,
      sender: currentUserId,
      type: "follow",
      message: `${req.user.name} started following you.`
    });

    res.json({ message: "Successfully followed user", following: currentProfile.following });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const unfollowUser = async (req: any, res: Response) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    const targetProfile = await Profile.findOne({ user: targetUserId });
    const currentProfile = await Profile.findOne({ user: currentUserId });

    if (!targetProfile || !currentProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    targetProfile.followers = targetProfile.followers.filter(id => id.toString() !== currentUserId.toString());
    await targetProfile.save();

    currentProfile.following = currentProfile.following.filter(id => id.toString() !== targetUserId.toString());
    await currentProfile.save();

    res.json({ message: "Successfully unfollowed user", following: currentProfile.following });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSuggestedProfiles = async (req: any, res: Response) => {
  try {
    const currentUserId = req.user._id;
    const currentProfile = await Profile.findOne({ user: currentUserId });

    if (!currentProfile) {
      return res.status(404).json({ message: "Your profile not found" });
    }

    // Fetch all other profiles
    const rawProfiles = await Profile.find({ user: { $ne: currentUserId } })
      .populate("user", ["name", "email", "profileImage", "role", "backgroundImage"]);

    // Filter out profiles where user might be null (e.g., if the user was deleted but profile remained)
    // AND hide admin users from recommendation candidates
    const allProfiles = rawProfiles.filter(p => 
      p.user && 
      p.user._id && 
      (p.user as any).role !== "admin"
    );

    // Priority: Skills (5) -> Job Role/Headline (4) -> Mutual Connections (3) -> Interests (2) -> Location (1)
    
    const Connection = require("../models/Connection").Connection;
    const myConnections = await Connection.find({
      $or: [{ requester: currentUserId }, { recipient: currentUserId }],
      status: "Accepted"
    });
    
    const myConnectionIds = myConnections.map((c: any) => 
      c.requester.toString() === currentUserId.toString() ? c.recipient.toString() : c.requester.toString()
    );

    // OPTIMIZATION: Fetch mutual connection candidates in one query to avoid N+1 queries in the loop
    const connectionsOfMyConnections = await Connection.find({
      $or: [
        { requester: { $in: myConnectionIds } },
        { recipient: { $in: myConnectionIds } }
      ],
      status: "Accepted"
    });

    const mutualConnectionMap = new Map<string, Set<string>>();
    connectionsOfMyConnections.forEach((conn: any) => {
      const reqId = conn.requester.toString();
      const recId = conn.recipient.toString();
      
      if (!mutualConnectionMap.has(reqId)) mutualConnectionMap.set(reqId, new Set());
      if (!mutualConnectionMap.has(recId)) mutualConnectionMap.set(recId, new Set());
      
      mutualConnectionMap.get(reqId)!.add(recId);
      mutualConnectionMap.get(recId)!.add(reqId);
    });

    const scoredProfiles = allProfiles.map((p: any) => {
      let score = 0;

      // 1. Location (1 point for exact match)
      if (p.location && currentProfile.location && p.location.toLowerCase() === currentProfile.location.toLowerCase()) {
        score += 1;
      }

      // 2. Interests (2 points per shared interest)
      if (p.interests && currentProfile.interests) {
        const sharedInterests = currentProfile.interests.filter((i: string) => 
          p.interests.some((pi: string) => pi.toLowerCase() === i.toLowerCase())
        );
        score += sharedInterests.length * 2;
      }

      // 3. Mutual Connections (3 points per mutual connection)
      const theirConnectionsSet = mutualConnectionMap.get(p.user._id.toString()) || new Set<string>();
      const mutualCount = myConnectionIds.filter((id: any) => theirConnectionsSet.has(id)).length;
      score += mutualCount * 3;

      // 4. Job Role / Headline (4 points for shared keywords)
      if (p.headline && currentProfile.headline) {
        const myHeadlineWords = currentProfile.headline.toLowerCase().split(" ");
        const theirHeadlineWords = p.headline.toLowerCase().split(" ");
        const sharedWords = myHeadlineWords.filter((w: string) => w.length > 3 && theirHeadlineWords.includes(w));
        score += sharedWords.length * 4;
      }

      // 5. Skills (5 points per shared skill)
      if (p.skills && currentProfile.skills) {
        const sharedSkills = currentProfile.skills.filter((s: string) => 
          p.skills.some((ps: string) => ps.toLowerCase() === s.toLowerCase())
        );
        score += sharedSkills.length * 5;
      }

      // 6. Cross-role affinity (recruiters want candidates, candidates want recruiters)
      const myRole = req.user.role || "student";
      const theirRole = (p.user as any)?.role || "student";
      
      if (myRole === "recruiter" && theirRole !== "recruiter") {
        score += 2;
      } else if (myRole !== "recruiter" && theirRole === "recruiter") {
        score += 2;
      }

      // Ensure everyone has at least a tiny score so no one is completely invisible
      if (score === 0) {
        score += 0.1;
      }

      return { profile: p, score };
    });

    // Filter out profiles with 0 score (no relevance), sort by score descending and return top 10
    const relevantProfiles = scoredProfiles.filter(sp => sp.score > 0);
    relevantProfiles.sort((a, b) => b.score - a.score);
    const suggested = relevantProfiles.slice(0, 10).map(sp => sp.profile);

    res.json(suggested);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMutualConnections = async (req: any, res: Response) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.json([]);
    }

    const Connection = require("../models/Connection").Connection;
    
    const myConnections = await Connection.find({
      $or: [{ requester: currentUserId }, { recipient: currentUserId }],
      status: "Accepted"
    });
    
    const myConnectionIds = myConnections.map((c: any) => 
      c.requester.toString() === currentUserId.toString() ? c.recipient.toString() : c.requester.toString()
    );

    const theirConnections = await Connection.find({
      $or: [{ requester: targetUserId }, { recipient: targetUserId }],
      status: "Accepted"
    });
    
    const theirConnectionIds = theirConnections.map((c: any) => 
      c.requester.toString() === targetUserId.toString() ? c.recipient.toString() : c.requester.toString()
    );

    const mutualIds = myConnectionIds.filter((id: any) => theirConnectionIds.includes(id));

    const User = require("../models/User").User;
    const mutualUsers = await User.find({ _id: { $in: mutualIds } }).select("name email profileImage headline");

    res.json(mutualUsers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
