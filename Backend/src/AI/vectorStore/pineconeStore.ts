import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { documentEmbeddings } from "../embeddings/embeddings";
import { Document } from "@langchain/core/documents";
import crypto from "node:crypto";

let pineconeIndex: any = null;

function getPineconeIndex() {
    if (!pineconeIndex) {
        const pinecone = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY! });
        pineconeIndex = pinecone.index("github");
    }
    return pineconeIndex;
}

async function storeDocuments(docs: Document[], repoUrl: string) {
    const validDocs = docs.filter(doc => doc.pageContent.trim().length > 0);
    if (validDocs.length === 0) throw new Error("No valid docs");

    const texts = validDocs.map(doc => doc.pageContent);
    const embeddings = await documentEmbeddings.embedDocuments(texts);

    const vectors = validDocs.map((doc, i) => {
        const hash = crypto.createHash('sha256').update(doc.pageContent).digest('hex');
        return {
            id: `doc-${hash}-${i}`,
            values: embeddings[i],
            metadata: {
                text: doc.pageContent,
                source: doc.metadata?.source || "github",
                repoUrl: repoUrl
            }
        };
    });

    await getPineconeIndex().upsert({ records: vectors }); // ✅ fixed
    console.log(`Stored ${vectors.length} vectors in Pinecone for: ${repoUrl}`);
}

async function getVectorStore(): Promise<PineconeStore> {
    return await PineconeStore.fromExistingIndex(documentEmbeddings, {
        pineconeIndex: getPineconeIndex() // ✅ fixed
    });
}

export { storeDocuments, getVectorStore };