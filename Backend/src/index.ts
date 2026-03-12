import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import Router from "./routes/useRoutes";
import DatabaseConnection from "./config/databse";
import passport from "passport";
import  "./config/passport.google"
import  "./config/passport.github";
import "./config/passport.jwt"

const app = express();
const PORT = process.env.PORT || 5001;

DatabaseConnection();

app.use(cors());
app.use(express.json());
app.use(passport.initialize())

app.use("/api", Router);

app.get("/", (req, res) => {
    res.send("Working Fine!!");
});

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});