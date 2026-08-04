import jwt from "jsonwebtoken"
import { Request, Response } from "express"

const AuthController = (req: Request, res: Response) => {
    const user = req.user as any

    const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "30d" }
    )
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`
    res.redirect(redirectUrl)
}

export default AuthController