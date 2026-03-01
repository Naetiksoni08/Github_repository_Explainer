import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

const documentEmbeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    taskType: TaskType.RETRIEVAL_DOCUMENT,
})

const queryEmbeddings = new GoogleGenerativeAIEmbeddings({ 
    model: "text-embedding-004",
    taskType: TaskType.RETRIEVAL_QUERY
})


export { documentEmbeddings, queryEmbeddings };
