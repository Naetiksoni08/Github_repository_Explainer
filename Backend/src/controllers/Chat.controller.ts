
import error from "../utils/error";
import { Request } from "express";
import { Response } from "express";
import Router from "../AI/agents/Router.agent";
import { AddMessage, getOrCreateSession } from "../AI/agents/memory";

const ChatController = async (req: Request, res: Response) => {
    try {
        const { sessionId, query, assistantTimestamp } = req.body
        const user = req.user as any;

        const existingSession = await getOrCreateSession(sessionId, "", user.id, query);
        const repoUrl = (existingSession as any)?.repoUrl?.trim() || ""

        res.setHeader("Content-Type", "text/event-stream")
        res.setHeader("Cache-Control", "no-cache")
        res.setHeader("Connection", "keep-alive")

        let fullresponse = "";
        let clientDisconnected = false;
        let streamCompleted = false;

        // ye asli fix hai — client disconnect hote hi flag set karo
        res.on("close", () => {
            if (!streamCompleted) {
                clientDisconnected = true;
            }
        });

        const stream = Router(sessionId, query, repoUrl);
        for await (const chunk of stream) {
            if (clientDisconnected) break;   // aage generate karna band karo
            fullresponse += chunk;
            res.write(`data: ${JSON.stringify(chunk)}\n\n`)
        }
        streamCompleted = true;  

        await AddMessage(sessionId, "user", query)
        await AddMessage(sessionId, "assistant", fullresponse, { interrupted: clientDisconnected,timestamp: assistantTimestamp  })

        if (!clientDisconnected) {
            res.write("data: [DONE]\n\n")
            res.end();
        }
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