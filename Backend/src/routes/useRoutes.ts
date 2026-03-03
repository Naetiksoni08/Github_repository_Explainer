import { Router } from "express"
import ingestRouter from "./Ingest.router"
import chatRouter from "./Chat.router"


const router = Router();
router.use(ingestRouter)
router.use(chatRouter)


export default Router