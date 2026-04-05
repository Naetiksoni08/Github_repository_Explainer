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
    const branches = ['main', 'master', 'develop', 'development'];
    for (const branch of branches) {
        try {
            const loader = new GithubRepoLoader(repoUrl, { ...options, branch: branch });
            let doc = await loader.load();
            if (doc.length > 0) {
                docs = doc;
                break;
            }
        } catch (error) {
            if (branch === branches[branches.length - 1]) {
                throw new Error("No documents loaded from repo")
            }else{
                continue;
            }
        }
    }
    return docs

}
export default LoadDocument