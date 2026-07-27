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

async function deleteExistingVectorsForRepo(repoUrl: string): Promise<void> {
    try {
        await getPineconeIndex().deleteMany({ repoUrl });
        console.log(`Cleared old vectors for: ${repoUrl}`);
    } catch (err) {
        // If there's nothing to delete yet (first-time ingest), Pinecone may
        // no-op or throw depending on SDK version — don't block ingestion on this.
        console.warn(`No existing vectors to clear (or delete failed) for: ${repoUrl}`, err);
    }
}

async function storeDocuments(docs: Document[], repoUrl: string) {
    const validDocs = docs.filter(doc => doc.pageContent.trim().length > 0);
    if (validDocs.length === 0) throw new Error("No valid docs");

    // remove any vectors from a previous ingest of this same repo, so
    // re-ingesting doesn't leave stale/outdated chunks mixed into retrieval
    await deleteExistingVectorsForRepo(repoUrl);

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

    await getPineconeIndex().upsert({ records: vectors });
    console.log(`Stored ${vectors.length} vectors in Pinecone for: ${repoUrl}`);
}

async function getVectorStore(): Promise<PineconeStore> {
    return await PineconeStore.fromExistingIndex(documentEmbeddings, {
        pineconeIndex: getPineconeIndex()
    });
}

export { storeDocuments, getVectorStore };