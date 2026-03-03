import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { documentEmbeddings } from "../embeddings/embeddings";
import { Document } from "@langchain/core/documents";

const pinecone = new PineconeClient({
    apiKey: process.env.PINECONE_API_KEY! // non null assertion
});

const pineconeIndex = pinecone.Index("github-repo-explainer");

async function storeDocuments(docs: Document[]) {
    await PineconeStore.fromDocuments(docs, documentEmbeddings, {
        pineconeIndex
    })
}

async function getVectorStore(): Promise<PineconeStore> {
    return await PineconeStore.fromExistingIndex(documentEmbeddings, {
        pineconeIndex
    })
}
export { storeDocuments, getVectorStore }