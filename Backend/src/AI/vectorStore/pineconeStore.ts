import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { documentEmbeddings } from "../embeddings/embeddings";
import { Document } from "@langchain/core/documents";
import crypto from "node:crypto"; 

const pinecone = new PineconeClient({
    apiKey: process.env.PINECONE_API_KEY! 
});

const pineconeIndex = pinecone.index("github"); // Lowercase 'index' is preferred in v7

async function storeDocuments(docs: Document[], repoUrl: string) {
    const validDocs = docs.filter(doc => doc.pageContent.trim().length > 0);
    
    if (validDocs.length === 0) throw new Error("No valid docs");

    // 1. Generate all embeddings first
    const texts = validDocs.map(doc => doc.pageContent);
    const embeddings = await documentEmbeddings.embedDocuments(texts);

    // 2. Map docs to vectors and generate the hash INSIDE the loop
    const vectors = validDocs.map((doc, i) => {
        // Generate hash for THIS specific document chunk
        const hash = crypto.createHash('sha256').update(doc.pageContent).digest('hex');
        
        return {
            id: `doc-${hash}-${i}`, // Unique but repeatable for the same content
            values: embeddings[i],
            metadata: { 
                text: doc.pageContent, 
                source: doc.metadata?.source || "github",
                repoUrl: repoUrl // Good practice to store the repo URL in metadata
            }
        };
    });

    // 3. Upsert using the v7.x object syntax
    await pineconeIndex.upsert({ records: vectors });
    
    console.log(`Stored ${vectors.length} vectors in Pinecone for: ${repoUrl}`);
}

async function getVectorStore(): Promise<PineconeStore> {
    return await PineconeStore.fromExistingIndex(documentEmbeddings, {
        pineconeIndex
    });
}

export { storeDocuments, getVectorStore };
