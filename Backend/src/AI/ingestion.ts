import LoadDocument from "./Loaders/GithubLoader";
import chunkPipeline from "./Chunking/orchestrator";
import { storeDocuments } from "./vectorStore/pineconeStore";
import { Document } from "@langchain/core/documents"

type ProgressCallback = (stage: string, percent: number) => void;

async function ingest(repoUrl: string, onProgress?: ProgressCallback): Promise<void> {
    onProgress?.("loading", 10);
    const docs = await LoadDocument(repoUrl);

    onProgress?.("chunking", 40);
    const chunks = await chunkPipeline(docs);
    console.log("Chunks count:", chunks.length)
    console.log("First chunk:", chunks[0].pageContent.substring(0, 100))
    if (chunks.length === 0) {
        throw new Error("No chunks generated from repo")
    }

    onProgress?.("cleaning", 60);
    const cleanedChunks: Document[] = chunks.map(chunk => new Document({
        pageContent: chunk.pageContent.replace(/<[^>]*>/g, ""),
        metadata: chunk.metadata
    }))

    onProgress?.("storing", 80);
    await storeDocuments(cleanedChunks, repoUrl);

    onProgress?.("done", 100);
}

export default ingest;