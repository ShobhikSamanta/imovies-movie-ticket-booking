// Small, dependency-free security helpers

// Removes keys starting with "$" or containing "." from req.body/query (blocks NoSQL operator injection)
const clean = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) delete obj[key];
    else clean(obj[key]);
  }
  return obj;
};
const sanitize = (req, res, next) => {
  clean(req.body);
  clean(req.query);
  next();
};

// Simple in-memory rate limiter: max `max` requests per `windowMs` per IP
const limiter = (max, windowMs) => {
  const hits = new Map();
  setInterval(() => hits.clear(), windowMs).unref();
  return (req, res, next) => {
    const n = (hits.get(req.ip) || 0) + 1;
    hits.set(req.ip, n);
    if (n > max) return res.status(429).json({ message: "Too many requests. Please try again later." });
    next();
  };
};

module.exports = { sanitize, limiter };
