import { Response } from "express";


const error = (res: Response, err: Error | unknown, message: string = "Internal Server Error", status = 500) => {
    return res.status(status).json({
        success: false,
        message,
        error: err
    })
}

export default error;