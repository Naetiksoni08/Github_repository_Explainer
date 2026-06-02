import { getVectorStore } from "../vectorStore/pineconeStore";
import rerank from "../Reranker/reranker";

async function retriever(query: string, repoUrl: string) {
    console.time("Retriever Total");

    const vectorStore = await getVectorStore();

    console.time("Similarity Search");
    const docs = await vectorStore.similaritySearch(
        query,
        7,
        { repoUrl }
    );
    console.timeEnd("Similarity Search");

    console.log(`Retrieved Docs: ${docs.length}`);

    if (docs.length === 0) {
        throw new Error(
            "No relevant documents found. Try re-ingesting the repository."
        );
    }

    console.time("Reranker");

    const rerankedDocs = await rerank.compressDocuments(
        docs,
        query
    );

    console.timeEnd("Reranker");

    console.log(
        `Docs After Reranking: ${rerankedDocs.length}`
    );

    const totalChars = rerankedDocs.reduce(
        (sum, doc) => sum + doc.pageContent.length,
        0
    );

    console.log(
        `Total Context Size: ${totalChars} characters`
    );

    console.timeEnd("Retriever Total");
    console.log(
        "Reranked Docs:",
        rerankedDocs.map(
            (doc) =>
                doc.metadata?.source ||
                doc.metadata?.filePath ||
                "Unknown"
        )
    );

    return rerankedDocs;
}

export default retriever;