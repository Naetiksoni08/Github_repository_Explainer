import { Document } from "@langchain/core/documents";
import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github"


async function LoadDocument(repoUrl: string): Promise<Document[]> {

    const GithubLoader = new GithubRepoLoader(repoUrl, {
        accessToken: process.env.GITHUB_ACCESS_TOKEN,
        branch: "main",
        recursive: true, // fetch files inside subfolders too
        unknown: "warn",
        maxConcurrency: 5
    })

    const docs = await GithubLoader.load();
    return docs;
}

export default LoadDocument;