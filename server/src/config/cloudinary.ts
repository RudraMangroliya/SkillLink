import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "skilllink_uploads",
      allowed_formats: ["jpg", "png", "jpeg", "webp", "gif", "avif"],
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`,
    };
  },
});

const rawStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPdf = file.originalname.toLowerCase().endsWith('.pdf');
    return {
      folder: "skilllink_uploads",
      allowed_formats: ["pdf", "docx"],
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`,
      resource_type: isPdf ? "image" : "raw",
    };
  },
});

const mediaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "skilllink_media",
      resource_type: "auto", // Allows audio/video
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

export const upload = multer({ storage: storage });
export const uploadRaw = multer({ storage: rawStorage });
export const uploadMedia = multer({ storage: mediaStorage });
export { cloudinary };
