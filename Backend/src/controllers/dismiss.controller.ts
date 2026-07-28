// controllers/dismiss.controller.ts
import { Request, Response } from "express";
import SessionModel from "../models/session.modal";

const DismissInterruptController = async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { timestamp } = req.body;

    if (!timestamp) {
        return res.status(400).json({ success: false, message: "timestamp is required" });
    }

    const session = await SessionModel.findOne({ sessionId });
    if (!session) {
        return res.status(404).json({ success: false, message: "Session not found" });
    }

    const msg = session.messages.find((m: any) => m.timestamp === timestamp);
    if (msg) {
        (msg as any).dismissed = true;
        await session.save();
    }

    res.json({ success: true });
};

export default DismissInterruptController;