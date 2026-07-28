// controllers/truncate.controller.ts
import { Request, Response } from "express";
import SessionModel from "../models/session.modal";

const TruncateController = async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { fromTimestamp } = req.body;

    if (!fromTimestamp) {
        return res.status(400).json({ success: false, message: "fromTimestamp is required" });
    }

    const session = await SessionModel.findOne({ sessionId });
    if (!session) {
        return res.status(404).json({ success: false, message: "Session not found" });
    }

    session.messages = session.messages.filter((m: any) => m.timestamp < fromTimestamp) as any;
    await session.save();

    res.json({ success: true });
};

export default TruncateController;