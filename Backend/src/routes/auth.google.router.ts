import { Router } from "express";
import passport from "passport";
import AuthController from "../controllers/auth.controller";

const router = Router()


router.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
)


router.get("/auth/google/callback",
    passport.authenticate("google", { session: false }),
        AuthController
)

export default router
