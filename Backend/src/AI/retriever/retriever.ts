import { getVectorStore } from "../vectorStore/pineconeStore";
import rerank from "../Reranker/reranker";



async function retriever(query: string) {

    const vectorStore = await getVectorStore()
    const docs = await vectorStore.similaritySearch(query, 10);
    const rereankeddocs = await rerank.compressDocuments(docs, query);
    return rereankeddocs;
}

export default retriever