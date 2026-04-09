
import { Request } from "express";
import { Response } from "express";
import error from "../utils/error";
import success from "../utils/success";

export const GetUserReposController = async (req: Request, res: Response) => {
    const user = req.user as any;
    const token = user.githubAceessToken;
    if (!token) return error(res, "No Github Token Found");

    const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=20", {
        headers: { Authorization: `bearer ${token}` }
    });
    const repos = await response.json();
    success(res,repos,"Repos Fetched");
}