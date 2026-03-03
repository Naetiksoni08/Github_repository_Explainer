import { Router } from "express";
import IngestController from "../controllers/Ingest.controller";


const router = Router()

router.post("/ingest", IngestController);


export default router;

