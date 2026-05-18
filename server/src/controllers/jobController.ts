import { Response } from "express";
import { Job } from "../models/Job";
import { Profile } from "../models/Profile";
import { User } from "../models/User";
import { Notification } from "../models/Notification";
import { sendNotification } from "../utils/notificationUtils";
import { sendEmail } from "../utils/sendEmail";

export const createJob = async (req: any, res: Response) => {
  try {
    if (req.user.role !== "recruiter" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to post jobs" });
    }

    const job = new Job({ ...req.body, recruiter: req.user._id });
    await job.save();

    // Find profiles with matching skills or headline
    const validReqs = job.requirements ? job.requirements.filter((r: string) => r && r.trim().length > 0) : [];
    
    if (validReqs.length > 0 || job.title) {
      const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const orConditions: any[] = [];
      
      if (validReqs.length > 0) {
        // Standard regex: candidate field contains requirement
        const regexRequirements = validReqs.map((req: string) => new RegExp(escapeRegex(req.trim()), 'i'));
        orConditions.push({ skills: { $in: regexRequirements } });
        orConditions.push({ headline: { $in: regexRequirements } });

        // Advanced Reverse Match: requirement contains candidate's skill/headline (e.g. Req="Full Stack Developer" matches Skill="Full Stack")
        validReqs.forEach((req: string) => {
          const lowerReq = req.trim().toLowerCase();
          
          // Reverse match against headline
          orConditions.push({
            $expr: {
              $and: [
                { $gte: [{ $strLenCP: { $ifNull: ["$headline", ""] } }, 4] },
                { $gte: [{ $indexOfCP: [lowerReq, { $toLower: "$headline" }] }, 0] }
              ]
            }
          });

          // Reverse match against skills array
          orConditions.push({
            $expr: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: { $ifNull: ["$skills", []] },
                      as: "skill",
                      cond: {
                        $and: [
                          { $gte: [{ $strLenCP: { $ifNull: ["$$skill", ""] } }, 4] },
                          { $gte: [{ $indexOfCP: [lowerReq, { $toLower: "$$skill" }] }, 0] }
                        ]
                      }
                    }
                  }
                },
                0
              ]
            }
          });
        });
      }

      if (job.title) {
        // Standard regex: headline contains job title
        const titleRegex = new RegExp(escapeRegex(job.title.trim()), 'i');
        orConditions.push({ headline: titleRegex });

        // Advanced Reverse Match: job title contains headline
        const lowerTitle = job.title.trim().toLowerCase();
        orConditions.push({
          $expr: {
            $and: [
              { $gte: [{ $strLenCP: { $ifNull: ["$headline", ""] } }, 4] },
              { $gte: [{ $indexOfCP: [lowerTitle, { $toLower: "$headline" }] }, 0] }
            ]
          }
        });
      }

      const matchingProfiles = await Profile.find({ $or: orConditions })
        .populate({
          path: 'user',
          match: { role: { $in: ['student', 'professional'] } },
          select: 'role _id'
        });

      // Filter out profiles where the user was excluded by the populate match (e.g., mentors, admins)
      const userIdsToNotify = new Set(
        matchingProfiles
          .filter(p => p.user)
          .map(p => (p.user as any)._id.toString())
      );
      
      for (const userId of userIdsToNotify) {
        if (userId === req.user._id.toString()) continue;
        await sendNotification({
          recipient: userId,
          sender: req.user._id,
          type: "job_match",
          relatedId: job._id.toString(),
          message: `A new job matching your skills has been posted: ${job.title} at ${job.company}`
        });
      }
    }

    res.status(201).json(job);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobs = async (req: any, res: Response) => {
  try {
    const jobs = await Job.find().populate("recruiter", "name email");
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const applyForJob = async (req: any, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if already applied
    const alreadyApplied = job.applications.find(
      (app) => app.applicant?.toString() === req.user._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    job.applications.push({ applicant: req.user._id });
    await job.save();

    await sendNotification({
      recipient: job.recruiter.toString(),
      sender: req.user._id,
      type: "job_applied",
      relatedId: job._id.toString(),
      message: `A candidate has applied for your job posting: ${job.title}`
    });

    res.json({ message: "Successfully applied for the job", job });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const editJob = async (req: any, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.recruiter.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to edit this job" });
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedJob);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteJob = async (req: any, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.recruiter.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this job" });
    }

    // Delete all notifications related to this job so we don't have orphan notifications
    await Notification.deleteMany({ relatedId: job._id });

    await job.deleteOne();
    res.json({ message: "Job deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleSaveJob = async (req: any, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const isSaved = job.savedBy.includes(req.user._id);
    if (isSaved) {
      job.savedBy = job.savedBy.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      job.savedBy.push(req.user._id);
    }
    
    await job.save();
    res.json({ message: isSaved ? "Job removed from saved" : "Job saved successfully", job });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSavedJobs = async (req: any, res: Response) => {
  try {
    const jobs = await Job.find({ savedBy: req.user._id }).populate("recruiter", "name email");
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateApplicationStatus = async (req: any, res: Response) => {
  try {
    const { status, interviewDate, interviewLink } = req.body;
    const job = await Job.findById(req.params.jobId);
    
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.recruiter.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update applications for this job" });
    }

    const application = job.applications.id(req.params.applicationId);
    if (!application) return res.status(404).json({ message: "Application not found" });

    const wasAlreadyShortlisted = application.status === 'Shortlisted';
    const isReschedule = wasAlreadyShortlisted && status === 'Shortlisted' && (interviewDate || interviewLink);

    if (status) application.status = status;
    if (interviewDate) application.interviewDate = interviewDate;
    if (interviewLink) application.interviewLink = interviewLink;

    await job.save();

    const candidateId = application.applicant?.toString();
    console.log(`[JobController] Updating application. Candidate ID: ${candidateId}`);
    
    if (candidateId) {
      const candidateUser = await User.findById(candidateId);
      console.log(`[JobController] Found candidate user: ${candidateUser ? candidateUser.email : 'NOT FOUND'}`);
      
      if (status === 'Shortlisted' || status === 'Rejected') {
        const notifMessage = isReschedule 
          ? `Your interview for ${job.title} has been rescheduled.`
          : `Your application for ${job.title} has been ${status.toLowerCase()}`;

        console.log(`[JobController] Sending in-app notification to candidate...`);
        await sendNotification({
          recipient: candidateId,
          sender: req.user._id,
          type: "job_status_update",
          relatedId: job._id.toString(),
          message: notifMessage
        });
        console.log(`[JobController] In-app notification sent.`);
      }

      if (status === 'Shortlisted' && candidateUser) {
        console.log(`[JobController] Preparing to send email to ${candidateUser.email}...`);
        const emailSubject = isReschedule ? `Interview Rescheduled: ${job.title}` : `Application Shortlisted: ${job.title}`;
        const emailGreeting = isReschedule ? `Update regarding your application, ${candidateUser.name}.` : `Good news, ${candidateUser.name}!`;
        const emailMainText = isReschedule 
          ? `Your interview for the <strong>${job.title}</strong> position at <strong>${job.company}</strong> has been rescheduled.`
          : `Congratulations! You have been successfully shortlisted for the <strong>${job.title}</strong> position at <strong>${job.company}</strong>.`;

        const emailMessage = `${isReschedule ? 'Update: Your interview has been rescheduled.' : 'Congratulations! You have been shortlisted.'}
        
${interviewDate ? `\nAn interview has been scheduled for: ${new Date(interviewDate).toLocaleString()}.` : ''}
${interviewLink ? `\nMeeting Link: ${interviewLink}` : ''}
        
Log in to your dashboard for more details.`;

        const frontendUrl = process.env.CLIENT_URL || "https://skill-link-rm.vercel.app";
        const emailHtml = `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">SkillLink</h1>
            </div>
            
            <div style="padding: 32px;">
              <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">${emailGreeting}</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                ${emailMainText}
              </p>

              ${(interviewDate || interviewLink) ? `
              <div style="background-color: #f3f4f6; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <h3 style="color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0; margin-bottom: 12px;">Interview Details</h3>
                ${interviewDate ? `<p style="color: #111827; font-size: 15px; margin: 0 0 8px 0;"><strong>Date & Time:</strong> ${new Date(interviewDate).toLocaleString()}</p>` : ''}
                ${interviewLink ? `<p style="color: #111827; font-size: 15px; margin: 0;"><strong>Meeting Link:</strong> <a href="${interviewLink}" style="color: #4f46e5; text-decoration: none;">Join Here</a></p>` : ''}
              </div>
              ` : ''}

              <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
                The recruiter will be reviewing your profile closely. You can track your application status directly from your dashboard.
              </p>
              
              <div style="text-align: center;">
                <a href="${frontendUrl}/jobs" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; font-size: 16px; text-decoration: none; padding: 12px 24px; border-radius: 8px; transition: background-color 0.2s;">
                  View Dashboard
                </a>
              </div>
            </div>
            
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                © ${new Date().getFullYear()} SkillLink. All rights reserved.<br>
                <span style="font-size: 12px;">This is an automated message, please do not reply.</span>
              </p>
            </div>
          </div>
        `;

        await sendEmail({
          email: candidateUser.email,
          subject: emailSubject,
          message: emailMessage,
          html: emailHtml
        });
      }
    }

    res.json({ message: "Application updated successfully", job });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecruiterJobs = async (req: any, res: Response) => {
  try {
    const jobs = await Job.find({ recruiter: req.user._id })
      .populate("applications.applicant", "name email profileImage headline")
      .sort("-createdAt");
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCandidateApplications = async (req: any, res: Response) => {
  try {
    const jobs = await Job.find({ "applications.applicant": req.user._id })
      .populate("recruiter", "name email profileImage company");
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req: any, res: Response) => {
  try {
    let pending = 0;
    let shortlisted = 0;
    let rejected = 0;
    let total = 0;

    if (req.user.role === "recruiter") {
      const jobs = await Job.find({ recruiter: req.user._id });
      jobs.forEach(job => {
        job.applications.forEach(app => {
          total++;
          if (app.status === "Pending") pending++;
          else if (app.status === "Shortlisted") shortlisted++;
          else if (app.status === "Rejected") rejected++;
        });
      });
    } else {
      const jobs = await Job.find({ "applications.applicant": req.user._id });
      jobs.forEach(job => {
        job.applications.forEach(app => {
          if (app.applicant?.toString() === req.user._id.toString()) {
            total++;
            if (app.status === "Pending") pending++;
            else if (app.status === "Shortlisted") shortlisted++;
            else if (app.status === "Rejected") rejected++;
          }
        });
      });
    }

    res.json({ total, pending, shortlisted, rejected });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
