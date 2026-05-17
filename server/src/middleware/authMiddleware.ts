import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

export const protect = async (req: Request | any, res: Response, next: NextFunction) => {
  let token;

  // First check HTTP-only cookie
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } 
  // Fallback to Bearer token for mobile apps or older clients
  else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

      req.user = await User.findById(decoded.id).select("-password");
      
      if (!req.user) {
         return res.status(401).json({ message: "Not authorized, user deleted" });
      }

      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed or expired" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
