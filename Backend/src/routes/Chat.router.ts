import { Router } from "express";
import ChatController from "../controllers/Chat.controller";
import passport from "passport";
import { chatLimiter } from "../utils/rateLimiter";


const router = Router()

router.post("/chat", passport.authenticate("jwt", { session: false }), chatLimiter, ChatController);


export default router;

