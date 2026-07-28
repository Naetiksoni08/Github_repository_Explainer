
import error from "../utils/error";
import { Request } from "express";
import { Response } from "express";
import Router from "../AI/agents/Router.agent";
import { AddMessage, getOrCreateSession } from "../AI/agents/memory";

const ChatController = async (req: Request, res: Response) => {
    try {
        const { sessionId, query } = req.body
        const user = req.user as any;

        // DB session hi authoritative source — frontend ka repoUrl trust mat karo
        const existingSession = await getOrCreateSession(sessionId, "", user.id, query);
        const repoUrl = (existingSession as any)?.repoUrl?.trim() || ""

        console.log("Chat request repoUrl:", JSON.stringify(repoUrl))

        res.setHeader("Content-Type", "text/event-stream")
        res.setHeader("Cache-Control", "no-cache")
        res.setHeader("Connection", "keep-alive")

        let fullresponse = "";
        const stream = Router(sessionId, query, repoUrl);
        for await (const chunk of stream) {
            fullresponse += chunk;
            res.write(`data: ${JSON.stringify(chunk)}\n\n`)
        }

        await AddMessage(sessionId, "user", query)
        await AddMessage(sessionId, "assistant", fullresponse)
        res.write("data: [DONE]\n\n")
        res.end();
    } catch (err: any) {
        if (!res.headersSent) {
            if (err?.status === 503) {
                return res.status(503).json({
                    message: "AI service is temporarily unavailable. Please try again in a few moments"
                });
            }
            error(res, err)
        } else {
            res.write("data: [ERROR]\n\n")
            res.end()
        }
    }
}

export default ChatController;