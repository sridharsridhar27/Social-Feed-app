import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middleware/authMiddleware.js"; // ✅ default import matches export
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();
const prisma = new PrismaClient();

/* =====================================================
   🔹 1. GET USER PROFILE
   ===================================================== */
router.get("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Count followers & following
    const followers = await prisma.follow.count({ where: { followingId: userId } });
    const following = await prisma.follow.count({ where: { followerId: userId } });

    res.json({ ...user, followers, following });
  } catch (err) {
    console.error("Fetch profile error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

/* =====================================================
   🔹 2. UPDATE BIO / USERNAME
   ===================================================== */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (req.user.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { username, bio } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { username, bio },
      select: { id: true, username: true, email: true, avatarUrl: true, bio: true },
    });

    res.json({ message: "Profile updated", user: updatedUser });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

/* =====================================================
   🔹 3. UPLOAD AVATAR (Cloudinary)
   ===================================================== */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "social-feed-avatars",
    allowedFormats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

router.post("/:id/avatar", authMiddleware, upload.single("avatar"), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (req.user.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const avatarUrl = req.file.path;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, username: true, email: true, avatarUrl: true },
    });

    res.json({ message: "Avatar uploaded", user: updatedUser });
  } catch (err) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

/* =====================================================
   🟢 4. FOLLOW USER
   ===================================================== */
router.post("/:id/follow", authMiddleware, async (req, res) => {
  try {
    const followerId = req.user.userId;
    const followingId = parseInt(req.params.id);

    if (followerId === followingId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const existing = await prisma.follow.findFirst({ where: { followerId, followingId } });
    if (existing) return res.status(400).json({ message: "Already following this user" });

    const follow = await prisma.follow.create({ data: { followerId, followingId } });

    res.json({ message: "Followed successfully", follow });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   🔴 5. UNFOLLOW USER
   ===================================================== */
router.post("/:id/unfollow", authMiddleware, async (req, res) => {
  try {
    const followerId = req.user.userId;
    const followingId = parseInt(req.params.id);

    const existing = await prisma.follow.findFirst({ where: { followerId, followingId } });
    if (!existing) return res.status(400).json({ message: "You are not following this user" });

    await prisma.follow.delete({ where: { id: existing.id } });

    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   🧠 6. CHECK FOLLOW STATUS
   ===================================================== */
router.get("/:id/isFollowing", authMiddleware, async (req, res) => {
  try {
    const followerId = req.user.userId;
    const followingId = parseInt(req.params.id);

    const follow = await prisma.follow.findFirst({ where: { followerId, followingId } });

    res.json({ isFollowing: !!follow });
  } catch (err) {
    console.error("Check follow error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;


