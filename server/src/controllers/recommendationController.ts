import { Response } from "express";
import axios from "axios";
import { Profile } from "../models/Profile";
import { Job } from "../models/Job";
import { Group } from "../models/Group";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export const getJobRecommendations = async (req: any, res: Response) => {
  try {
    const userProfile = await Profile.findOne({ user: req.user._id });
    if (!userProfile) {
      return res.status(404).json({ message: "Profile not found to base recommendations on" });
    }

    const allJobs = await Job.find().limit(50); // Get recent jobs to compare

    const payload = {
      source_profile: {
        user_id: req.user._id.toString(),
        skills: userProfile.skills || [],
        interests: userProfile.interests || [],
        headline: userProfile.headline || "",
        bio: userProfile.bio || ""
      },
      targets: allJobs.map(job => {
        const reqStr = job.requirements.join(' ');
        // Repeat title 3x and requirements 5x to ensure the AI prioritizes hard skills over generic descriptions
        return {
          id: job._id.toString(),
          text_data: `${job.title} ${job.title} ${job.title} ${reqStr} ${reqStr} ${reqStr} ${reqStr} ${reqStr} ${job.description}`
        };
      })
    };

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/recommend`, payload);
    const recommendedIds = aiResponse.data.recommendations.map((r: any) => r.id);

    // Fetch the actual job objects based on the recommended IDs
    const recommendedJobs = await Job.find({ _id: { $in: recommendedIds } })
      .populate("recruiter", "name company");

    // Sort to match AI service order
    recommendedJobs.sort((a, b) => 
      recommendedIds.indexOf(a._id.toString()) - recommendedIds.indexOf(b._id.toString())
    );

    res.json(recommendedJobs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroupRecommendations = async (req: any, res: Response) => {
  try {
    const userProfile = await Profile.findOne({ user: req.user._id });
    const nonJoinedGroups = await Group.find({ members: { $ne: req.user._id } }).limit(50);
    
    if (nonJoinedGroups.length === 0) return res.json([]);

    if (!userProfile) {
      return res.json(nonJoinedGroups);
    }

    const payload = {
      source_profile: {
        user_id: req.user._id.toString(),
        skills: userProfile.skills || [],
        interests: userProfile.interests || [],
        headline: userProfile.headline || "",
        bio: userProfile.bio || ""
      },
      targets: nonJoinedGroups.map(group => ({
        id: group._id.toString(),
        text_data: `${group.name} ${group.description}`
      }))
    };

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/recommend`, payload);
    const recommendedIds = aiResponse.data.recommendations.map((r: any) => r.id);

    const recommendedGroups = await Group.find({ _id: { $in: recommendedIds } });

    // Sort to match AI service order
    recommendedGroups.sort((a, b) => 
      recommendedIds.indexOf(a._id.toString()) - recommendedIds.indexOf(b._id.toString())
    );

    res.json(recommendedGroups);
  } catch (error: any) {
    // If AI fails, fallback to standard non-joined groups
    const nonJoinedGroups = await Group.find({ members: { $ne: req.user._id } }).limit(20);
    res.json(nonJoinedGroups);
  }
};

export const getSmartReply = async (req: any, res: Response) => {
  try {
    const { message } = req.body;
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/smart-reply`, { message });
    res.json(aiResponse.data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
