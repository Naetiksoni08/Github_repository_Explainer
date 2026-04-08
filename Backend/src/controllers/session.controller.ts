import success from "../utils/success";
import error from "../utils/error";
import { Request } from "express";
import { Response } from "express";
import SessionModel from "../models/session.modal";


export const GetSessionByIdController = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const session = await SessionModel.findOne({ sessionId })
        success(res, session, "Sessions Fetched")
    } catch (err) {
        error(res, "Something Went Wrong")

    }
}


export const GetAllSessionsController = async (req: Request, res: Response) => {
    try {
        // Assuming your passport/JWT middleware attaches user to req.user
        // Or if you store userId in the session document:
        const userId = (req.user as any)._id;

        const sessions = await SessionModel.find({ userId }).sort({ createdAt: -1 });
        success(res, sessions, "All Sessions Fetched");
    } catch (err) {
        error(res, "Could not fetch sessions");
    }
}

export const DeleteSessionController = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        await SessionModel.findOneAndDelete({ sessionId });
        success(res, null, "Session Deleted");
    } catch (err) {
        error(res, "Something Went Wrong");
    }
}

export const RenameSessionController = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const { title } = req.body;
        await SessionModel.findOneAndUpdate({ sessionId }, { title });
        success(res, null, "Session Rename");
    } catch (err) {
        error(res, "Something Went Wrong");
    }
}

export const StarSessionController = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const userId = (req.user as any)._id;
        const session = await SessionModel.findOne({ sessionId });
        if (!session) return error(res, "Session not found");
        if (!session?.starred) {
            const starredCount = await SessionModel.countDocuments({ userId, starred: true })
            if (starredCount >= 3) return error(res, "Max 3 Starred Sessions Allowed");
        }
        session.starred = !session?.starred;
        await session.save();
        success(res, null, session.starred ? "Session Starred" : "Session Unstarred");
    } catch (err) {
        error(res, "Something Went Wrong");

    }
}

