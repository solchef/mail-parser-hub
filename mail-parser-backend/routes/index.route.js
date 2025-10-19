// routes/index.js
import express from "express";
import authRoutes from "./auth.route.js";
import userRoutes from "./user.route.js";
import fileRoutes from "./files.route.js";
import dbConnRoutes from "./dbConnections.route.js";
import mappingRoutes from "./mappings.route.js";
import importRoutes from "./imports.route.js";
import inboxesRoutes from "./inboxes.route.js";
import archiveRoutes from "./archive.route.js";
import googleAuth from "./auth.google.route.js";
import authMiddleware from "../middlewares/authenticate.js";

const router = express.Router();

// ✅ Public routes (no auth required)
router.use("/auth", authRoutes);
router.use("/auth/google", googleAuth);

// ✅ Protected routes (require valid token)
router.use("/users", authMiddleware, userRoutes);
router.use("/files", authMiddleware, fileRoutes);
router.use("/database", authMiddleware, dbConnRoutes);
router.use("/mappings", authMiddleware, mappingRoutes);
router.use("/imports", authMiddleware, importRoutes);
router.use("/inboxes", authMiddleware, inboxesRoutes);
router.use("/archives", authMiddleware, archiveRoutes);

export default router;
