import { Document } from "@langchain/core/documents";
import llm from "..";


async function llmchunker(BadChunks: Document[]): Promise<Document[]> {
    const RechunkedDocs: Document[] = [];
    
    for (const chunk of BadChunks) {
        const prompt = `You are a code chunking assistant.
            Split the following code into logical meaningful chunks.
            Return ONLY a JSON array of strings, no explanation, no markdown.
            code:${chunk.pageContent};
        `
        const response = await llm.invoke(prompt)

        const raw = response.content as string
        const clean = raw.replace(/```json|```/g, "").trim()
        const sanitized = clean.replace(/[\x00-\x1F\x7F]/g, " ")  // ← control chars hatao
        const parsed: string[] = JSON.parse(sanitized)
        const newDocs = parsed.map(str => new Document({ pageContent: str }));
        RechunkedDocs.push(...newDocs)
    }
    return RechunkedDocs


}

export default llmchunker;