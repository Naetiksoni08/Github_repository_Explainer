import { ChatOpenAI } from '@langchain/openai'
import dotenv from 'dotenv'
dotenv.config()


const llm = new ChatOpenAI({
    model: "qwen/qwen3-next-80b-a3b-instruct:free", 
    apiKey:process.env.OPENROUTER_API_KEY,
    temperature: 0.7,
    maxRetries: 3,
    configuration: { baseURL: "https://openrouter.ai/api/v1" }
})


export default llm;