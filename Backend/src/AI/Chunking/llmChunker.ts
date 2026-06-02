import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import llm from "..";


async function llmchunker(BadChunks: Document[]): Promise<Document[]> {
    const RechunkedDocs: Document[] = [];

    const fallbackSplitter = RecursiveCharacterTextSplitter.fromLanguage("js", {
        chunkSize: 450,
        chunkOverlap: 80
    });

    for (const chunk of BadChunks) {
        const prompt = `You are a code chunking assistant.
Return ONLY a JSON array of strings.
Rules:
- Create 2 to 5 chunks max
- Keep each chunk meaningful and self-contained
- Prefer 120 to 700 characters per chunk
- Avoid trivial comments-only chunks
- No explanation, no markdown, JSON only

CODE:
${chunk.pageContent}`;

        try {
            const response = await llm.invoke(prompt);
            const raw = response.content as string;
            const clean = raw.replace(/```json|```/g, "").trim();
            const sanitized = clean.replace(/[\x00-\x1F\x7F]/g, " ");
            const parsed: string[] = JSON.parse(sanitized);

            const useful = parsed
                .map((str) => str.trim())
                .filter((str) => str.length >= 100 && str.length <= 1600);

            if (useful.length === 0) throw new Error("No useful LLM chunks");

            const newDocs = useful.map(
                (str) =>
                    new Document({
                        pageContent: str,
                        metadata: chunk.metadata
                    })
            );
            RechunkedDocs.push(...newDocs);
        } catch {
            const fallbackDocs = await fallbackSplitter.splitDocuments([chunk]);
            RechunkedDocs.push(...fallbackDocs);
        }
    }

    return RechunkedDocs;


}

export default llmchunker;