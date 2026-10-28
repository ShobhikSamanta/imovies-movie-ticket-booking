const jwt = require("jsonwebtoken");
const User = require("../models/User");

const getUserFromRequest = async (req) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
  if (!token) return null;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(decoded.id).select("-password");
};

// Requires a valid "Authorization: Bearer <token>" header
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return res.status(401).json({ message: "Not logged in" });

    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "User no longer exists" });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Attaches req.user if a valid token is sent, but never blocks the request
const optionalAuth = async (req, res, next) => {
  try {
    req.user = await getUserFromRequest(req);
  } catch (err) {
    req.user = null;
  }
  next();
};

// Use after protect
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  res.status(403).json({ message: "Admin access required" });
};

module.exports = { protect, optionalAuth, adminOnly };
