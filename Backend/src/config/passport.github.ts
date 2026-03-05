import passport from "passport";
import { Strategy as GithubStrategy } from "passport-github2"
import UserModel from "../models/user.modal";


passport.use(new GithubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: "http://localhost:5001/api/auth/github/callback"
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
        // find user
        let user = await UserModel.findOne({ githubId: profile.id });
        //if no user then create one 
        if (!user) {
            user = await UserModel.create({
                githubId: profile.id,
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
