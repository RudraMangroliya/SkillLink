import mongoose from "mongoose";

export interface IGroup extends mongoose.Document {
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  category: string;
  tags: string[];
  admin: mongoose.Types.ObjectId;
  moderators: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  rules: string[];
  visibility: "public" | "private";
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "General",
    },
    tags: [
      {
        type: String,
      },
    ],
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    rules: [
      {
        type: String,
      },
    ],
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
  },
  {
    timestamps: true,
  }
);

export const Group = mongoose.model<IGroup>("Group", GroupSchema);
