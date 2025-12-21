import { Router } from "express";
import { signin, signout, signup } from "../controller/auth.controller";

export const authRouter: Router = Router();

authRouter.post("/signup", signup);
authRouter.post("/signin", signin);
authRouter.post("/signout", signout);