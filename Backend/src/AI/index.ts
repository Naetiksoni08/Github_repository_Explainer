import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';
dotenv.config();

async function getFreeModels(limit = 3): Promise<string[]> {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    const data = await res.json();
    return data.data
        .filter((m: any) =>
            m.pricing.prompt === "0" &&
            m.pricing.completion === "0" &&
            !m.id.includes("safety") &&
            !m.id.includes("guard") &&
            !m.id.includes("moderation")
        )
        .slice(0, limit)
        .map((m: any) => m.id);
}

let llm: ChatOpenAI;

async function initLLM() {
    const freeModels = await getFreeModels(3);
    console.log("Using free models:", freeModels);

    llm = new ChatOpenAI({
        model: freeModels[0],
        apiKey: process.env.OPENROUTER_API_KEY,
        temperature: 0.7,
        maxRetries: 3,
        configuration: { baseURL: "https://openrouter.ai/api/v1" },
        modelKwargs: {
            models: freeModels,
            provider: { allow_fallbacks: true }
        }
    });

    return llm;
}

const llmPromise = initLLM();

export default llmPromise;