import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.SECRET_KEY, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    httpOnly: true, // prevents XSS attacks, make it not accessible via JS
    sameSite: "lax", // prevents CSRF attacks
    secure: process.env.NODE_ENV !== "development",
    path: "/", // CRITICAL: Makes the cookie available for the whole site
  });

  return token;
};