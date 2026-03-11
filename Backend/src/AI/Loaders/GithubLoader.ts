import { Document } from "@langchain/core/documents";
import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github"

async function LoadDocument(repoUrl: string): Promise<Document[]> {
    const options = {
        accessToken: process.env.GITHUB_ACCESS_TOKEN,
        recursive: true,
        unknown: "warn" as "warn",
        maxConcurrency: 5,
        ignoreFiles: ["package-lock.json", "yarn.lock", "*.png", "*.jpg", "*.svg"]
    }

    let docs: Document[] = [];
    
    try {
        const loader = new GithubRepoLoader(repoUrl, { ...options, branch: "main" })
        docs = await loader.load()
    } catch {
        const loader = new GithubRepoLoader(repoUrl, { ...options, branch: "master" })
        docs = await loader.load()
    }

    if (!docs.length) throw new Error("No documents loaded from repo")
    
    console.log("Loaded docs:", docs.length)
    return docs
}
export default LoadDocument