import jwt from "jsonwebtoken"
import { Request, Response } from "express"
import success from "../utils/success"

const AuthController = (req: Request, res: Response) => {
    const user = req.user as any  // passport ne user attach kiya hai

    const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "30d" }
    )

    success(res, { token, user }, "Logged in successfully")
}

export default AuthController