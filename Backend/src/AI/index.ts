import { ChatOpenAI } from '@langchain/openai'
import dotenv from 'dotenv'
dotenv.config()


const llm = new ChatOpenAI({
    model: "google/gemma-3-27b-it:free",
    apiKey:process.env.OPENROUTER_API_KEY,
    temperature: 0.7,
    maxRetries: 5,
    configuration: { baseURL: "https://openrouter.ai/api/v1" } //redirects all calls to OpenRouter instead of OpenAI
})




// async function result() {
//     let response = await llm.invoke("Hey!! Whats the date today?")
//     console.log(response);
// }
// result();


export default llm;