import { Response } from "express";

const success = (res: Response, data: unknown, message: string = "Success", status = 200) => {
    return res.status(status).json({
        success: true,
        message,
        data
    })
}
export default success;

