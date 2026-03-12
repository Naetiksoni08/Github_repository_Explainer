import { Router } from "express"
import ingestRouter from "./Ingest.router"
import chatRouter from "./Chat.router"
import GoogleauthRouter from "./auth.google.router"
import GithubauthRouter from "./auth.github.router"
import GetSessionsRouter from "./session.router";


const router = Router();
router.use(ingestRouter)
router.use(chatRouter)
router.use(GoogleauthRouter)
router.use(GithubauthRouter)
router.use(GetSessionsRouter)


export default router;