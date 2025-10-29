import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middleware/authMiddleware.js";   // ✅ default import (matches middleware)
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();
const prisma = new PrismaClient();

/* =====================================================
   ⚙️ Cloudinary + Multer setup
   ===================================================== */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "social-feed-posts",
    allowedFormats: ["jpg", "png", "jpeg"],
  },
});
const upload = multer({ storage });

/* =====================================================
   🟢 CREATE POST
   POST /api/posts
   ===================================================== */
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { caption } = req.body;
    const userId = req.user.userId;

    if (!req.file?.path) {
      return res.status(400).json({ message: "Image is required" });
    }

    const imageUrl = req.file.path;

    const newPost = await prisma.post.create({
      data: { caption, imageUrl, userId },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    res.status(201).json({ message: "Post created", post: newPost });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

/* =====================================================
   📰 GET POSTS (feed)
   GET /api/posts?limit=10&offset=0&following=true
   ===================================================== */
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit || "10"));
    const offset = parseInt(req.query.offset || "0");
    const personalized = req.query.following === "true";

    // Personalized feed requires JWT
    if (personalized) {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ message: "Authentication required for personalized feed" });
      }

      const token = authHeader.split(" ")[1];
      const jwt = await import("jsonwebtoken").then((m) => m.default);

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUserId = decoded.userId;

        // Users current user follows
        const follows = await prisma.follow.findMany({
          where: { followerId: currentUserId },
          select: { followingId: true },
        });
        const followingIds = follows.map((f) => f.followingId);

        if (!followingIds.length) {
          return res.json({ posts: [], limit, offset });
        }

        const posts = await prisma.post.findMany({
          where: { userId: { in: followingIds } },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
            _count: { select: { likes: true, comments: true } },
          },
        });

        return res.json({ posts, limit, offset });
      } catch (err) {
        console.error("Personalized feed token error:", err);
        return res.status(403).json({ message: "Invalid or expired token" });
      }
    }

    // Public feed
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    res.json({ posts, limit, offset });
  } catch (err) {
    console.error("Get posts error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

/* =====================================================
   🔍 GET SINGLE POST
   ===================================================== */
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({ post });
  } catch (err) {
    console.error("Get post error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

/* =====================================================
   ❤️ LIKE / UNLIKE POST
   ===================================================== */
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.userId;

    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      return res.json({ liked: false, message: "Post unliked" });
    }

    await prisma.like.create({ data: { userId, postId } });
    res.json({ liked: true, message: "Post liked" });
  } catch (err) {
    console.error("Like toggle error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

/* =====================================================
   💬 GET COMMENTS
   ===================================================== */
router.get("/:id/comments", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    res.json({ comments });
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

/* =====================================================
   💭 ADD COMMENT
   ===================================================== */
router.post("/:id/comments", authMiddleware, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.userId;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const comment = await prisma.comment.create({
      data: { text, userId, postId },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    res.status(201).json({ message: "Comment added", comment });
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// ------------------
// GET POSTS BY USER
// ------------------
router.get("/user/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        imageUrl: true,
        caption: true,
      },
    });

    res.json({ posts });
  } catch (err) {
    console.error("Get user posts error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});


export default router;


