import { ChatOpenAI } from '@langchain/openai'
import dotenv from 'dotenv'
dotenv.config()


const llm = new ChatOpenAI({
    model: "openai/gpt-oss-120b:free", 
    apiKey:process.env.OPENROUTER_API_KEY,
    temperature: 0.7,
    maxRetries: 5,
    configuration: { baseURL: "https://openrouter.ai/api/v1" }
})


export default llm;