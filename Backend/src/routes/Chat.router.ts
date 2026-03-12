import { Router } from "express";
import ChatController from "../controllers/Chat.controller";
import passport from "passport";


const router = Router()

router.post("/chat", passport.authenticate("jwt", { session: false }), ChatController);


export default router;

