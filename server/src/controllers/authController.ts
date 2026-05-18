import { Request, Response, CookieOptions } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Profile } from "../models/Profile";
import { Connection } from "../models/Connection";
import { GroupDiscussion } from "../models/GroupDiscussion";
import { cloudinary } from "../config/cloudinary";
import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { deleteUserCompletely } from "../utils/deleteUserHelper";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Access Token: Short lived (2 days as requested)
const generateAccessToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: "2d",
  });
};

// Refresh Token: Long lived (7 days)
const generateRefreshToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

const setCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 2 * 24 * 60 * 60 * 1000 // 2 days
  });
  
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    if (user) {
      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());
      setCookies(res, accessToken, refreshToken);

      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        backgroundImage: user.backgroundImage,
        token: accessToken // Send token for immediate use or fallback
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.password && user.googleId) {
      return res.status(400).json({ message: "This account was created using Google. Please log in with Google." });
    }

    if (user.password && (await bcrypt.compare(password, user.password))) {
      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());
      setCookies(res, accessToken, refreshToken);

      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        backgroundImage: user.backgroundImage,
        token: accessToken
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken, role } = req.body;
    
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      return res.status(400).json({ message: "Invalid Google Token" });
    }

    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        profileImage: picture,
        role: role || "student", // Use passed role, fallback to student
      });
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    setCookies(res, accessToken, refreshToken);

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      backgroundImage: user.backgroundImage,
      token: accessToken
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions: CookieOptions = { 
    httpOnly: true, 
    expires: new Date(0),
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax"
  };
  res.cookie("accessToken", "", cookieOptions);
  res.cookie("refreshToken", "", cookieOptions);
  res.json({ message: "Logged out successfully" });
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const rfToken = req.cookies.refreshToken;
    if (!rfToken) {
      return res.status(401).json({ message: "Not authorized, no refresh token" });
    }

    const decoded = jwt.verify(rfToken, process.env.JWT_SECRET as string) as any;
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }

    const newAccessToken = generateAccessToken(user._id.toString());
    const isProduction = process.env.NODE_ENV === "production";
    
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 2 * 24 * 60 * 60 * 1000 // 2 days
    });

    res.json({ token: newAccessToken });
  } catch (error: any) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Mail transporter configuration is created dynamically inside the function
// to ensure process.env variables are fully loaded from dotenv first.

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP to expire in 2 minutes
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 2 * 60 * 1000); 
    await user.save();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-w-md mx-auto p-6 bg-gray-50 border border-gray-200 rounded-xl">
        <h2 style="color: #4f46e5; text-align: center; margin-bottom: 24px;">SkillLink Password Reset</h2>
        <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">Hello ${user.name},</p>
        <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">We received a request to reset your password. Use the verification code below to securely reset your password. This code will expire in exactly <strong>2 minutes</strong>.</p>
        <div style="background-color: #eef2ff; border: 2px dashed #818cf8; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: bold; color: #4338ca; letter-spacing: 4px;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: user.email,
      subject: "SkillLink Password Reset Verification Code",
      html: emailHtml,
    };

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent to your email" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ 
      email, 
      otp, 
      otpExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    
    await user.save();

    res.json({ message: "Password reset successful. Please login with your new password." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

const extractPublicId = (url: string) => {
  if (!url) return null;
  const parts = url.split("/");
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex !== -1 && uploadIndex < parts.length - 1) {
    let startIndex = uploadIndex + 1;
    if (parts[startIndex].startsWith('v') && !isNaN(parseInt(parts[startIndex].substring(1)))) {
      startIndex++; // skip version
    }
    const pathParts = parts.slice(startIndex);
    const fullPath = pathParts.join("/");
    const lastDotIndex = fullPath.lastIndexOf(".");
    return lastDotIndex !== -1 ? fullPath.substring(0, lastDotIndex) : fullPath;
  }
  return null;
};

export const deleteAccount = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the user completely using the shared utility
    await deleteUserCompletely(userId);

    // Clear Auth Cookies
    res.cookie("accessToken", "", { httpOnly: true, expires: new Date(0) });
    res.cookie("refreshToken", "", { httpOnly: true, expires: new Date(0) });

    res.json({ message: "Account completely deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
