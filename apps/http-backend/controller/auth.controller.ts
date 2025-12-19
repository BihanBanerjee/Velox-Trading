import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "@exness/prisma-client";

const generateToken = (userId: string) => {
    return jwt.sign({userId}, process.env.JWT_SECRET!, {expiresIn: "1d"}); // Here ! is a non-null assertion operator. It tells TS that this value is not null or undefined, trust me.
}

const setAuthCookie = (res: Response, token: string) => {
    res.cookie(
        "token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000
        }
    )
}

export const signup = async (req: Request, res: Response) => {
    try {
        const { email, phone, password } = req.body;
        if(!email || !phone || !password) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                phone,
                password: hashedPassword,
            }
        })

        // Register user in liquidation engine with initial dummy balance (1000 USD)
        const INITIAL_BALANCE = 100000000000n // 1000.00000000 * 10^8
        try {
            
        } catch (error) {

        }
    } catch (error) {
        
    }
}