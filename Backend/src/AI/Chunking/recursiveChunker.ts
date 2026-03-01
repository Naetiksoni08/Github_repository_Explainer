import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";


async function recursivechunker(docs: Document[]): Promise<Document[]> {
    const splitter = RecursiveCharacterTextSplitter.fromLanguage("js", {
        chunkSize: 1000,
        chunkOverlap: 200
    })
    const text = await splitter.splitDocuments(docs);
    return text

}

export default recursivechunker