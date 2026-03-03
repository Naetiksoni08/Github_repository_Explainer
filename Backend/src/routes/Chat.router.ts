import { Router } from "express";
import ChatController from "../controllers/Chat.controller";


const router = Router()

router.post("/chat", ChatController);


export default router;

