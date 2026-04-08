import { Router } from "express";
import { GetSessionByIdController, GetAllSessionsController, DeleteSessionController, RenameSessionController, StarSessionController } from "../controllers/session.controller";


import passport from "passport";


const router = Router()

router.get("/sessions", passport.authenticate("jwt", { session: false }), GetAllSessionsController);
router.get("/sessions/:sessionId", passport.authenticate("jwt", { session: false }), GetSessionByIdController);
router.delete("/sessions/:sessionId", passport.authenticate("jwt", { session: false }), DeleteSessionController);
router.patch("/sessions/:sessionId", passport.authenticate("jwt", { session: false }), RenameSessionController);
router.patch("/sessions/:sessionId/star", passport.authenticate("jwt", { session: false }), StarSessionController);



export default router;