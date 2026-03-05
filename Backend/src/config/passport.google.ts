import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import UserModel from "../models/user.modal";




passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "http://localhost:5001/api/auth/google/callback"
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
        // find user
        let user = await UserModel.findOne({ googleId: profile.id });
        //if no user then create one 
        if (!user) {
            user = await UserModel.create({
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails?.[0].value,
                picture: profile.photos?.[0].value
            })
        }
        //done callback
        return done(null, user);
    } catch (err) {
        return done(err)

    }


}))
