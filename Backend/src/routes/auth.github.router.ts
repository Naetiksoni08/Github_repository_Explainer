import { Router } from "express";
import passport from "passport";
import AuthController from "../controllers/auth.controller";


const router = Router()

router.get("/auth/github",
    passport.authenticate("github", { scope: ["user:email"] })
)

router.get("/auth/github/callback",
    passport.authenticate("github", { session: false }),
    AuthController
)

export default router