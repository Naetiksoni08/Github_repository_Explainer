import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";


async function recursivechunker(docs: Document[]): Promise<Document[]> {
    const normalizedDocs = docs
        .map((doc) => {
            const cleaned = doc.pageContent
                .replace(/\r\n/g, "\n")
                .replace(/[ \t]+\n/g, "\n")
                .trim();

            return new Document({
                pageContent: cleaned,
                metadata: doc.metadata
            });
        })
        .filter((doc) => doc.pageContent.length > 0);

    const splitter = RecursiveCharacterTextSplitter.fromLanguage("js", {
        // Smaller chunks improve retrieval precision.
        chunkSize: 700,
        chunkOverlap: 120
    });

    return splitter.splitDocuments(normalizedDocs);

}

export default recursivechunker