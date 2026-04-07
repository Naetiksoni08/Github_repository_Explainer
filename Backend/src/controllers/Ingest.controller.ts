import success from "../utils/success";
import error from "../utils/error";
import { Request } from "express";
import { Response } from "express";
import ingest from "../AI/ingestion";
import { getOrCreateSession } from "../AI/agents/memory";



const IngestController = async (req: Request, res: Response) => {
    try {
        console.log("Ingest started:", req.body)
        const { repoUrl: rawUrl, sessionId } = req.body
        const repoUrl = rawUrl.trim()
        const user = req.user as any
        await ingest(repoUrl)
        await getOrCreateSession(sessionId, repoUrl, user.id, "");
        success(res, { repoUrl }, "Repository ingested successfully")
    } catch (err) {
        console.log("Ingest error:", err) 
        error(res, "Something went Wrong")
    }
}

export default IngestController;