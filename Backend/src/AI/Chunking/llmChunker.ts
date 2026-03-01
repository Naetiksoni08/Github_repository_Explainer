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

        const parsed: string[] = JSON.parse(response.content as string);
        const newDocs = parsed.map(str => new Document({ pageContent: str }));
        RechunkedDocs.push(...newDocs)
    }
    return RechunkedDocs


}

export default llmchunker;