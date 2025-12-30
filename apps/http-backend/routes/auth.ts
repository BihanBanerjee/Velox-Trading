import { Router } from "express";
import { signin, signout, signup } from "../controller/auth.controller";
import { validateBody, signupSchema, signinSchema } from "@exness/validation";

export const authRouter: Router = Router();

authRouter.post("/signup", validateBody(signupSchema), signup);
authRouter.post("/signin", validateBody(signinSchema), signin);
authRouter.post("/signout", signout);