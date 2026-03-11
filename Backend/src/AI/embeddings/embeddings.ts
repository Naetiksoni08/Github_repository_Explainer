import { CohereEmbeddings } from "@langchain/cohere"

const documentEmbeddings = new CohereEmbeddings({
  apiKey: process.env.COHERE_API_KEY,
  model: "embed-english-v3.0"
})

const queryEmbeddings = new CohereEmbeddings({
  apiKey: process.env.COHERE_API_KEY,
  model: "embed-english-v3.0"
})

export { documentEmbeddings, queryEmbeddings }