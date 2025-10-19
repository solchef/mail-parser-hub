// middlewares/auth.middleware.js
import HttpStatus from "http-status-codes";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model.js";

export default async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(HttpStatus.FORBIDDEN).json({ error: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(HttpStatus.FORBIDDEN).json({ error: "Malformed token" });
        }

        const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
        const user = await UserModel.findById(decoded.id);

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({ error: "User not found" });
        }

        req.currentUser = {
            id: user.id,
            email: user.email,
            role: user.role, // include role for role-based access later
        };

        next();
    } catch (err) {
        console.error("Auth error:", err.message);
        return res.status(HttpStatus.UNAUTHORIZED).json({
            error: "Unauthorized: invalid or expired token",
        });
    }
};
