import mongoose from "mongoose";

const JobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Remote"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: {
      type: [String],
      required: true,
    },
    salaryRange: {
      type: String,
    },
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    applications: [
      {
        applicant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["Pending", "Shortlisted", "Rejected", "Hired"],
          default: "Pending",
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        interviewDate: {
          type: Date,
        },
        interviewLink: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Job = mongoose.model("Job", JobSchema);
