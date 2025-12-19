import { Router } from "express";

export const authRouter: Router = Router();

authRouter.post("/signup")
authRouter.post("/signin")
authRouter.post("/signout")