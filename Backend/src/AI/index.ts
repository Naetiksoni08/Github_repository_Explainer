import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';
dotenv.config();

export class LLMServiceUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LLMServiceUnavailableError";
    }
}

const RETRY_COOLDOWN_MS = 60_000;

let cachedLLM: any = null;
let lastFailureTime = 0;
let initializingPromise: Promise<any> | null = null;

async function getFreeModels(limit = 3): Promise<string[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("https://openrouter.ai/api/v1/models", {
        signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`OpenRouter returned ${res.status}`);

    const data = await res.json();
    if (!data?.data || !Array.isArray(data.data)) throw new Error("Invalid format");

    const freeModels = data.data
        .filter((m: any) => {
            const promptPrice = parseFloat(m.pricing?.prompt ?? "1");
            const completionPrice = parseFloat(m.pricing?.completion ?? "1");
            return (
                promptPrice === 0 &&
                completionPrice === 0 &&
                !m.id.includes("safety") &&
                !m.id.includes("guard") &&
                !m.id.includes("moderation")
            );
        })
        .slice(0, limit)
        .map((m: any) => m.id);

    if (freeModels.length === 0) throw new Error("No free models");

    console.log("[LLM] Fetched free models:", freeModels);
    return freeModels;
}

async function initLLM() {
    const freeModels = await getFreeModels(3);

    console.log("LLM config check:", JSON.stringify({ model: freeModels[0], models: freeModels }, null, 2));

    return new ChatOpenAI({
        model: freeModels[0],
        apiKey: process.env.OPENROUTER_API_KEY,
        temperature: 0.7,
        maxRetries: 2,
        configuration: {
            baseURL: "https://openrouter.ai/api/v1",
            timeout: 25000,
        },
        modelKwargs: {
            models: freeModels,
            provider: { allow_fallbacks: true, sort: "throughput" }
        }
    });
}

async function getLLM(): Promise<any> {
    if (cachedLLM) return cachedLLM;

    const now = Date.now();
    const cooldownActive = lastFailureTime !== 0 && (now - lastFailureTime) < RETRY_COOLDOWN_MS;

    if (cooldownActive) {
        throw new LLMServiceUnavailableError(
            "AI service is currently unavailable. Please try again shortly."
        );
    }

    if (!initializingPromise) {
        initializingPromise = initLLM()
            .then((llm) => {
                cachedLLM = llm;
                lastFailureTime = 0;
                initializingPromise = null;
                console.log("[LLM] Init succeeded — service restored.");
                return llm;
            })
            .catch((err) => {
                lastFailureTime = Date.now();
                initializingPromise = null;
                console.error("[LLM] Init attempt failed:", err.message);
                throw new LLMServiceUnavailableError(
                    "AI service is currently unavailable. Please try again shortly."
                );
            });
    }

    return initializingPromise;
}

const llmPromise = {
    stream: async (prompt: string) => {
        const llm = await getLLM();
        return llm.stream(prompt);
    },
    invoke: async (prompt: string) => {
        const llm = await getLLM();
        return llm.invoke(prompt);
    }
};

export default llmPromise;