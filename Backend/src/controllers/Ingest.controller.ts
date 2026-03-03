import success from "../utils/success";
import error from "../utils/error";
import { Request } from "express";
import { Response } from "express";
import ingest from "../AI/ingestion";


const IngestController = async (req: Request, res: Response) => {
    try {
        const { repoUrl } = req.body
        await ingest(repoUrl)
        success(res, { repoUrl }, "Repository ingested successfully")
    } catch(err) {
        error(res, err)
    }
}

export default IngestController;