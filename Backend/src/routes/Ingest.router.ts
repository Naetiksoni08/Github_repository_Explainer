import { Router } from "express";
import IngestController from "../controllers/Ingest.controller";
import passport from "passport";
import { ingestLimiter } from "../utils/rateLimiter";


const router = Router()

router.post("/ingest", passport.authenticate("jwt", { session: false }), ingestLimiter, IngestController);



export default router;

