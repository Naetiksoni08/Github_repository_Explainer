const CHUNK_TIMEOUT_MS = 25_000; // agar 25s tak koi naya chunk na aaye, hung consider karo

function timeoutPromise(ms: number): Promise<"TIMEOUT"> {
    return new Promise((resolve) => setTimeout(() => resolve("TIMEOUT"), ms));
}

async function* safeStream(llm: any, prompt: string): AsyncGenerator<string> {
    try {
        const stream = await llm.stream(prompt);
        const iterator = stream[Symbol.asyncIterator]();
        let yieldedAnything = false;

        while (true) {
            const result = await Promise.race([
                iterator.next(),
                timeoutPromise(CHUNK_TIMEOUT_MS)
            ]);

            if (result === "TIMEOUT") {
                console.error("[safeStream] Stream hung — no chunk received within timeout");
                yield "\n\n_The response took too long and timed out. Please try again._";
                yield "[ERROR]";
                return;
            }

            const { done, value } = result as IteratorResult<any>;
            if (done) break;

            yieldedAnything = true;
            yield value.content as string;
        }

        if (!yieldedAnything) {
            yield "[ERROR]";
        }
    } catch (error: any) {
        console.error("LLM stream failed:", error?.message || error);

        if (error?.name === "LLMServiceUnavailableError") {
            yield "\n\n_AI service is currently unavailable. Please try again shortly._";
        } else if (error?.status === 429) {
            yield "\n\n_AI service is busy right now. Please wait a moment and try again._";
        } else if (error?.status === 503) {
            yield "\n\n_AI service is temporarily unavailable. Please try again shortly._";
        } else {
            yield "\n\n_Something went wrong while generating the response. Please try again._";
        }
        yield "[ERROR]";
    }
}

export default safeStream;