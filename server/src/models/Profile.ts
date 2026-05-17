import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    headline: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    projects: [
      {
        title: String,
        description: String,
        link: String,
      },
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        date: Date,
      },
    ],
    education: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        startYear: String,
        endYear: String,
      },
    ],
    experience: [
      {
        company: String,
        title: String,
        location: String,
        startYear: String,
        endYear: String,
        description: String,
        current: Boolean,
      },
    ],
    githubLink: {
      type: String,
    },
    portfolioLink: {
      type: String,
    },
    resumeUrl: {
      type: String,
    },
    profileCompletionScore: {
      type: Number,
      default: 0,
    },
    endorsements: [
      {
        skill: String,
        endorsers: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
      },
    ],
    recommendations: [
      {
        text: String,
        recommender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

ProfileSchema.pre("save", function () {
  let score = 0;
  
  if (this.headline && this.headline.trim().length > 0) score += 10;
  if (this.bio && this.bio.trim().length > 0) score += 10;
  if (this.location && this.location.trim().length > 0) score += 10;
  
  if (this.skills && this.skills.length >= 3) score += 15;
  else if (this.skills && this.skills.length > 0) score += 5;
  
  if (this.interests && this.interests.length > 0) score += 10;
  if (this.education && this.education.length > 0) score += 15;
  if (this.resumeUrl) score += 10;
  
  if (this.experience && this.experience.length > 0) score += 10;
  if (this.projects && this.projects.length > 0) score += 5;
  if (this.certifications && this.certifications.length > 0) score += 5;

  // Max score = 100
  // Required fields for 100%: Headline(10) + Bio(10) + Location(10) + Skills>=3(15) + Interests(10) + Education(15) + Resume(10) + Experience(10) + Projects(5) + Certifications(5) = 100
  
  this.profileCompletionScore = Math.min(score, 100);
});

export const Profile = mongoose.model("Profile", ProfileSchema);
