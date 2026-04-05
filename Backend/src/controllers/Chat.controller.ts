import error from "../utils/error";
import { Request } from "express";
import { Response } from "express";
import Router from "../AI/agents/Router.agent";
import { AddMessage, getOrCreateSession } from "../AI/agents/memory";


const ChatController = async (req: Request, res: Response) => {
    try {
        const { repoUrl, sessionId, query } = req.body
        const user = req.user as any;

        res.setHeader("Content-Type", "text/event-stream")
        res.setHeader("Cache-Control", "no-cache")
        res.setHeader("Connection", "keep-alive")

        await getOrCreateSession(sessionId, repoUrl, user.id, query);

        let fullresponse = "";
        const stream = Router(sessionId, query, repoUrl);
        for await (const chunk of stream) {
            fullresponse += chunk;
            // res.write(`data: ${chunk}\n\n`)
            res.write(`data: ${JSON.stringify(chunk)}\n\n`)
        }

        await AddMessage(sessionId, "user", query)
        await AddMessage(sessionId, "assistant", fullresponse)
        res.write("data: [DONE]\n\n")
        res.end();
    } catch (err) {
        if (!res.headersSent) {
            error(res, err)
        } else {
            res.write("data: [ERROR]\n\n")
            res.end()
        }
    }
}

export default ChatController;