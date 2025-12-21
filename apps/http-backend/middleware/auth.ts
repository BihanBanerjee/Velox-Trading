import { prisma } from "@exness/prisma-client";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { User } from "@exness/prisma-client/generated/prisma/client";

export interface authRequest extends Request {
    user?: User
}
export const authMiddleware = async (
    req: authRequest,
    res: Response,
    next: NextFunction
) => {
    const token = req.cookies?.token;

    if(!token) {
        return res.status(401).json({
            error: "Unauthorized. No token provided."  
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: string;
        };

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId
            }
        });

        if(!user) {
            return res.status(404).json({
                error: "User not found."
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({
            error: "Auth error!"
        });
    }
}

