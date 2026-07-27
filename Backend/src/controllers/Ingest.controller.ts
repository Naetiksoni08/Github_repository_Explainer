import { Request, Response } from "express";
import ingest from "../AI/ingestion";
import { getOrCreateSession } from "../AI/agents/memory";
import { invalidateCacheForRepo } from "../utils/cache";

const IngestController = async (req: Request, res: Response) => {
    const { repoUrl: rawUrl, sessionId } = req.body;
    const repoUrl = rawUrl.trim();
    const user = req.user as any;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const sendProgress = (stage: string, percent: number) => {
        res.write(`data: ${JSON.stringify({ stage, percent })}\n\n`);
    };

    try {
        console.log("Ingest started:", req.body);

        await ingest(repoUrl, sendProgress);

        invalidateCacheForRepo(repoUrl);
        await getOrCreateSession(sessionId, repoUrl, user.id, "");

        res.write(`data: ${JSON.stringify({ done: true, repoUrl })}\n\n`);
        res.end();
    } catch (err) {
        console.log("Ingest error:", err);
        res.write(`data: ${JSON.stringify({ error: true, message: "Something went wrong" })}\n\n`);
        res.end();
    }
};

export default IngestController;