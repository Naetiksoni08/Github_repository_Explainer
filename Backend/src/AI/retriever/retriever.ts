import { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { getVectorStore } from "../vectorStore/pineconeStore";


async function retriever(): Promise<VectorStoreRetriever> {
    const vectorStore = await getVectorStore()
    return vectorStore.asRetriever({ k: 5 })
}

export default retriever