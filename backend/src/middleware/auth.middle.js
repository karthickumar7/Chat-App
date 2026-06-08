import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    // 1. MUST BE 'req.cookies' (plural). If you use 'req.cookie', it will be undefined.
    // 2. Ensure the first two arguments are (req, res) in that exact order.
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ msg: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    if (!decoded) {
      return res.status(401).json({ msg: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Attach user to the request object
    req.user = user;

    next();
  } catch (error) {
    console.error(`[Auth Middleware Error]: ${error.stack}`);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};