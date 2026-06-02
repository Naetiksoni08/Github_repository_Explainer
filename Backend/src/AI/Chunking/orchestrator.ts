import qualitychunker from "./qualityChecker";
import recursivechunker from "./recursiveChunker";
import llmchunker from "./llmChunker";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

async function chunkPipeline(docs: Document[]): Promise<Document[]> {
    const allChunks = await recursivechunker(docs);
    const [goodChunks, badChunks] = qualitychunker(allChunks);

    if (badChunks.length === 0) return goodChunks;

    // Latency guard: only send a small number of genuinely large chunks to the LLM.
    const LLM_MIN_CHARS = 1800;
    const LLM_MAX_CALLS = 8;

    const llmCandidates = badChunks
        .filter((doc) => doc.pageContent.trim().length >= LLM_MIN_CHARS)
        .slice(0, LLM_MAX_CALLS);

    const localCandidates = badChunks.filter((doc) => !llmCandidates.includes(doc));

    const fallbackSplitter = RecursiveCharacterTextSplitter.fromLanguage("js", {
        chunkSize: 450,
        chunkOverlap: 80
    });

    const locallyRechunked = localCandidates.length
        ? await fallbackSplitter.splitDocuments(localCandidates)
        : [];

    const llmRechunked = llmCandidates.length
        ? await llmchunker(llmCandidates)
        : [];

    const rechunked = [...locallyRechunked, ...llmRechunked];
    const [goodRechunked] = qualitychunker(rechunked);

    return [...goodChunks, ...goodRechunked];

}

export default chunkPipeline;