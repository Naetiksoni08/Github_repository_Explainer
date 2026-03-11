import LoadDocument from "./Loaders/GithubLoader";
import chunkPipeline from "./Chunking/orchestrator";
import { storeDocuments } from "./vectorStore/pineconeStore";
import { documentEmbeddings } from "./embeddings/embeddings";
import { Document } from "@langchain/core/documents"

async function ingest(repoUrl: string): Promise<void> {
    const docs = await LoadDocument(repoUrl);
    const chunks = await chunkPipeline(docs);
    console.log("Chunks count:", chunks.length)
    console.log("First chunk:", chunks[0].pageContent.substring(0, 100))
    if (chunks.length === 0) {
        throw new Error("No chunks generated from repo")
    }
    const testDocs = chunks.map(c => c.pageContent)

    const embeddings = await documentEmbeddings.embedDocuments(testDocs)

    console.log("Embeddings generated:", embeddings.length)
    console.log("Embedding dimension:", embeddings[0]?.length)
    const cleanedChunks: Document[] = chunks.map(chunk => new Document({
        pageContent: chunk.pageContent.replace(/<[^>]*>/g, ""),
        metadata: chunk.metadata
    }))

    await storeDocuments(cleanedChunks,repoUrl);

}

export default ingest;