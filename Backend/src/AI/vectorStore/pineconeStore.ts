import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { documentEmbeddings } from "../embeddings/embeddings";
import { Document } from "@langchain/core/documents";
// import crypto from "node:crypto"; // Built-in Node.js module

const pinecone = new PineconeClient({
    apiKey: process.env.PINECONE_API_KEY! // non null assertion
});

const pineconeIndex = pinecone.Index("github");
async function storeDocuments(docs: Document[],repoUrl:string) {
    const validDocs = docs.filter(doc => doc.pageContent.trim().length > 0);
    if (validDocs.length === 0) throw new Error("No valid docs");

    const texts = validDocs.map(doc => doc.pageContent);
    const embeddings = await documentEmbeddings.embedDocuments(texts);

    const vectors = validDocs.map((doc, i) => ({
       id: `${repoUrl.replace(/[^a-zA-Z0-9]/g, "-")}-${i}`,
        values: embeddings[i],
        metadata: { 
            text: doc.pageContent, // Renamed for LangChain compatibility
            source: doc.metadata?.source || "github"
        }
    }));

    // Correct v7.x syntax: wrap in { records: [...] }
    await pineconeIndex.upsert({
        records: vectors
    });
    
    console.log("Stored in Pinecone:", vectors.length);
}

async function getVectorStore(): Promise<PineconeStore> {
    return await PineconeStore.fromExistingIndex(documentEmbeddings, {
        pineconeIndex
    })
}
export { storeDocuments, getVectorStore }