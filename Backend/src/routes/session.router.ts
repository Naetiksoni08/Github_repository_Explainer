import { Router } from "express";
import { GetSessionByIdController, GetAllSessionsController, DeleteSessionController } from "../controllers/session.controller";


import passport from "passport";


const router = Router()

router.get("/sessions", passport.authenticate("jwt", { session: false }), GetAllSessionsController);
router.get("/sessions/:sessionId", passport.authenticate("jwt", { session: false }), GetSessionByIdController);
router.delete("/sessions/:sessionId", passport.authenticate("jwt", { session: false }), GetSessionByIdController);
router.patch("/sessions/:sessionId", passport.authenticate("jwt", { session: false }), GetSessionByIdController);



export default router;