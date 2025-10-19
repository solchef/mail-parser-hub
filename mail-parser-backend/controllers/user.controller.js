import bcrypt from "bcrypt";
import HttpStatus from "http-status-codes";
import { v4 as uuidv4 } from "uuid";
import { UserModel } from "../models/user.model.js";

/**
 * Find all users
 */
export async function findAll(req, res) {
    try {
        const users = await UserModel.all();
        res.json({
            error: false,
            data: users
        });
    } catch (err) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: err.message
        });
    }
}

/**
 * Find user by ID
 */
export async function findById(req, res) {
    try {
        const user = await UserModel.findById(req.params.id);

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({
                error: true,
                data: {}
            });
        }

        res.json({
            error: false,
            data: user
        });
    } catch (err) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: err.message
        });
    }
}

/**
 * Store new user
 */
export async function store(req, res) {
    try {
        const { name, email, password, role, status } = req.body;
        console.log(name, email, password, role, status);

        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            return res.status(HttpStatus.CONFLICT).json({
                error: true,
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            role,
            status
        };

        await UserModel.create(newUser);

        res.json({
            success: true,
            data: newUser
        });
    } catch (err) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: err.message
        });
    }
}

/**
 * Update user by ID
 */
export async function update(req, res) {
    try {
        const { name, email, password } = req.body;

        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({
                error: true,
                message: "User not found"
            });
        }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : user.password;

        const updatedUser = {
            ...user,
            name: name || user.name,
            email: email || user.email,
            password: hashedPassword
        };

        await UserModel.update(req.params.id, updatedUser);

        res.json({
            error: false,
            data: updatedUser
        });
    } catch (err) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: err.message
        });
    }
}

/**
 * Destroy user by ID
 */
export async function destroy(req, res) {
    try {
        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).json({
                error: true,
                message: "User not found"
            });
        }

        await UserModel.remove(req.params.id);

        res.json({
            error: false,
            data: { message: "User deleted successfully." }
        });
    } catch (err) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: err.message
        });
    }
}
