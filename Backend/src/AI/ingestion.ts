import LoadDocument from "./Loaders/GithubLoader";
import chunkPipeline from "./Chunking/orchestrator";
import { storeDocuments } from "./vectorStore/pineconeStore";

async function ingest(repoUrl: string): Promise<void> {
    const docs = await LoadDocument(repoUrl);
    const chunks = await chunkPipeline(docs);
    await storeDocuments(chunks);
}

export default ingest;