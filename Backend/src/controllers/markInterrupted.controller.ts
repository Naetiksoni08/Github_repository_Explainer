// controllers/markInterrupted.controller.ts
import { Request, Response } from "express";
import SessionModel from "../models/session.modal";

const MarkInterruptedController = async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { timestamp, content } = req.body;

    if (!timestamp) {
        return res.status(400).json({ success: false, message: "timestamp is required" });
    }

    const session = await SessionModel.findOne({ sessionId });
    if (!session) {
        return res.status(404).json({ success: false, message: "Session not found" });
    }

    const existing = session.messages.find((m: any) => m.timestamp === timestamp);
    if (existing) {
        (existing as any).interrupted = true;
        if (content !== undefined) (existing as any).content = content;
    } else {
        // agar partial message backend mein abhi save hi nahi hua tha, naya push karo
        session.messages.push({
            role: "assistant",
            content: content || "",
            timestamp,
            interrupted: true
        } as any);
    }

    await session.save();
    res.json({ success: true });
};

export default MarkInterruptedController;