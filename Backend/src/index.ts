import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import Router from "./routes/useRoutes";
import DatabaseConnection from "./config/databse";

const app = express();
const PORT = process.env.PORT || 5001;

DatabaseConnection();

app.use(cors());
app.use(express.json());

app.use("/api/users", Router);

app.get("/", (req, res) => {
    res.send("Working Fine!!");
});

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});