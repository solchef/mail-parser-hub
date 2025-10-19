import HttpStatus from "http-status-codes"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import logger from "../config/winston.js"
import { UserModel } from "../models/user.model.js"

/**
 * Authenticates a user and returns a JWT token.
 */
export async function login(req, res) {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(HttpStatus.BAD_REQUEST).json({
            success: false,
            message: "Email and password are required",
        })
    }

    try {
        const user = await UserModel.findByEmail(email)

        if (!user) {
            logger.warn(`Login failed: user not found for email ${email}`)
            return res.status(HttpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Invalid username or password",
            })
        }

        const passwordMatch = await bcrypt.compare(password, user.password)

        if (!passwordMatch) {
            logger.warn(`Login failed: invalid password for ${email}`)
            return res.status(HttpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Invalid username or password",
            })
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.TOKEN_SECRET_KEY,
            { expiresIn: "1h" }
        )

        logger.info(`User logged in: ${email}`)

        res.json({
            success: true,
            token,
            email: user.email,
        })
    } catch (error) {
        logger.error("Login error:", error)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal server error",
        })
    }
}
