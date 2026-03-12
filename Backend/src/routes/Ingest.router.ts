import { Router } from "express";
import IngestController from "../controllers/Ingest.controller";
import passport from "passport";


const router = Router()

router.post("/ingest", passport.authenticate("jwt", { session: false }), IngestController);



export default router;

