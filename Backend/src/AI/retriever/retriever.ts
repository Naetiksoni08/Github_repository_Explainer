import { getVectorStore } from "../vectorStore/pineconeStore";
import rerank from "../Reranker/reranker";



async function retriever(query: string,repoUrl:string) {

    const vectorStore = await getVectorStore()
    const docs = await vectorStore.similaritySearch(query, 10,{repoUrl});
    if (docs.length === 0) {
        throw new Error("No relevant documents found. Try re-ingesting the repository.")  
    }
    const rereankeddocs = await rerank.compressDocuments(docs, query);
    return rereankeddocs;
}

export default retriever