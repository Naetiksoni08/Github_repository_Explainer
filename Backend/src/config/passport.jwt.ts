import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt"
import UserModel from "../models/user.modal";

passport.use("jwt", new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET!
}, async (Payload, done) => {
    try {
        const user = await UserModel.findById(Payload.id);
        if (user) return done(null, user);
        return done(null, false)
    } catch (error) {
        return done(null, false);

    }
}))