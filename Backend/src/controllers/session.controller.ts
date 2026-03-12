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
