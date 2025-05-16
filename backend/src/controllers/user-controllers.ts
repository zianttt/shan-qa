import { Request, Response, NextFunction } from "express";
import User from "../models/User.js";
import { hash, compare } from "bcrypt";
import { createToken } from "../utils/token-manager.js";
import { COOKIE_NAME } from "../utils/constants.js";

export const getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const users = await User.find();
        res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            users,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
}

export const userSignup = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: "User already exists",
            });
            return;
        }
        const hashedPassword = await hash(password, 10);
        const user = await User.create({ name, email, pwd_hash: hashedPassword });
        await user.save();

        // Clear existing cookies
        res.clearCookie(COOKIE_NAME, {
            httpOnly: true,
            domain: process.env.DOMAIN,
            signed: true,
            path: "/",
        });

        // Create a new token and set it in the cookie
        const token = createToken(user._id.toString(), user.email, "7d");
        const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 
        res.cookie(COOKIE_NAME, token, {
            path: "/",
            domain: process.env.DOMAIN,
            expires: expiryDate,
            httpOnly: true,
            signed: true,
        })

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user_id: user._id,
            name: user.name,
            email: user.email,
        });

    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
}

export const userLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }

        // Compare password with hashed password (not implemented here)
        const isMatch = await compare(password, user.pwd_hash);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
            return;
        }

        // Clear existing cookies
        res.clearCookie(COOKIE_NAME, {
            httpOnly: true,
            domain: process.env.DOMAIN,
            signed: true,
            path: "/",
        });

        // Create a new token and set it in the cookie
        const token = createToken(user._id.toString(), user.email, "7d");
        const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 
        res.cookie(COOKIE_NAME, token, {
            path: "/",
            domain: process.env.DOMAIN,
            expires: expiryDate,
            httpOnly: true,
            signed: true,
        })

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user_id: user._id,
            name: user.name,
            email: user.email,
        });

    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
}

export const userLogout = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        res.clearCookie(COOKIE_NAME, {
            httpOnly: true,
            domain: process.env.DOMAIN,
            signed: true,
        });
        res.status(200).json({
            success: true,
            message: "User logged out successfully",
        });
    } catch (error) {
        console.error("Error logging out user:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
}

export const verifyUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await User.findById(res.locals.jwtData.id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found or token expired",
            });
            return;
        }

        if (user._id.toString() !== res.locals.jwtData.id) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "User verified successfully",
            user_id: user._id,
            name: user.name,
            email: user.email,
        });

    } catch (error) {
        
    }
}