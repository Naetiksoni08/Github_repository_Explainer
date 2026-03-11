import qualitychunker from "./qualityChecker";
import recursivechunker from "./recursiveChunker";
import llmchunker from "./llmChunker";
import { Document } from "@langchain/core/documents";

async function chunkPipeline(docs: Document[]): Promise<Document[]> {
    const allChunks = await recursivechunker(docs);
    // const [goodChunks, badChunks] = qualitychunker(allChunks)
    // const rechunked = await llmchunker(badChunks)
    // return [...goodChunks, ...rechunked]
    return allChunks;

}

export default chunkPipeline;