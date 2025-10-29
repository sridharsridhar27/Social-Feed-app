// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // decoded = { userId: 1, iat, exp }
    next();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
}


