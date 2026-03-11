import { CohereRerank } from "@langchain/cohere";

const rerank = new CohereRerank({
    apiKey: process.env.COHERE_API_KEY,
    model: "rerank-english-v3.0",
    topN: 5
})

export default rerank;