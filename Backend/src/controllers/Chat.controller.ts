import success from "../utils/success";
import error from "../utils/error";
import { Request } from "express";
import { Response } from "express";
import Router from "../AI/agents/Router.agent";
import { AddMessage, getOrCreateSession } from "../AI/agents/memory";


const ChatController = async (req: Request, res: Response) => {
    try {
        const { repoUrl, sessionId, query } = req.body
        const user = req.user as any;
        await getOrCreateSession(sessionId, repoUrl,user.id);
        const result = await Router(sessionId, query)
        await AddMessage(sessionId, "user", query)
        await AddMessage(sessionId, "assistant", result)
        success(res, { result }, "Success")
    } catch (err) {
        error(res, err)
    }
}

export default ChatController;