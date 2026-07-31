import llmPromise from "..";
import CodeAnalyzerAgent from "./Code.agent";
import DebuggerAgent from "./Debugger.agent";
import GeneralAgent from "./General.agent";
import Rag_Agent from "./Rag.agent";
import SummarizerAgent from "./Summary.agent";
import { getCommonResponse } from "../../utils/commonResponses";

type Intent = "code_analyzer" | "summarizer" | "debugger" | "Rag_Agent" | "General"
const REPO_DEPENDENT_INTENTS = ["code_analyzer", "summarizer", "debugger", "Rag_Agent"];

async function* Router(sessionId: string, Query: string, repoUrl: string): AsyncGenerator<string> {

    console.log("Router called with query:", Query);

    // STEP 0: static, repo-independent common responses — no LLM call at all
    const commonResponse = getCommonResponse(Query, !!repoUrl?.trim());
    if (commonResponse) {
        console.log("Common response matched — skipping LLM entirely");
        yield commonResponse;
        return;
    }

    const RouterPrompt = `
Classify the query into one category:

- code_analyzer
- summarizer
- debugger
- Rag_Agent
- General

Definitions:

code_analyzer:
Explain code, functions, classes, implementation.

summarizer:
Repository overview, file summary, project summary.

debugger:
Errors, bugs, exceptions, fixes.

Rag_Agent:
Repository questions, architecture, files, behavior.

General:
Questions unrelated to the repository.

Rules:
- If a repository URL is present and the query could reasonably refer to the repository, choose Rag_Agent.
- If no repository URL is present and the intent is unclear, choose General.

Return ONLY:

{"intent":"Rag_Agent"}

Query:
${Query}

Repository:
${repoUrl || "None"}
`;

    try {
        const q = Query.toLowerCase().trim();

        if (
            q.includes("error") ||
            q.includes("bug") ||
            q.includes("exception") ||
            q.includes("stack trace") ||
            q.includes("not working") ||
            q.includes("fails") ||
            q.includes("failing") ||
            q.includes("crash") ||
            q.includes("crashes")
        ) {
            console.log("Fast Route → DebuggerAgent");

            if (REPO_DEPENDENT_INTENTS.includes("debugger") && !repoUrl?.trim()) {
                for await (const chunk of GeneralAgent(sessionId, Query)) {
                    yield chunk;
                }
                return;
            }

            return yield* DebuggerAgent(sessionId, Query, repoUrl);
        }

        if (
            q.includes("what does this repo do") ||
            q.includes("repository overview") ||
            q.includes("repo overview") ||
            q.includes("summarize") ||
            q.includes("summary") ||
            q.includes("overview") ||
            q.includes("what does this repository do") ||
            q.includes("tell me about this repo") ||
            q.includes("tell me about this repository") ||
            q.includes("explain this project") ||
            q === "overview" ||
            q === "summary"
        ) {
            console.log("Fast Route → SummarizerAgent");

            if (REPO_DEPENDENT_INTENTS.includes("summarizer") && !repoUrl?.trim()) {
                for await (const chunk of GeneralAgent(sessionId, Query)) {
                    yield chunk;
                }
                return;
            }

            return yield* SummarizerAgent(sessionId, Query, repoUrl);
        }

        if (
            q.includes("explain this code") ||
            q.includes("explain this function") ||
            q.includes("walk me through") ||
            q.includes("how does this function work") ||
            q.includes("analyze this code") ||
            q.includes("explain the implementation") ||
            q.includes("explain this file") ||
            q.includes("explain this class") ||
            q.includes("what does this function do") ||
            q.includes("how does this class work")
        ) {
            console.log("Fast Route → CodeAnalyzerAgent");

            if (REPO_DEPENDENT_INTENTS.includes("code_analyzer") && !repoUrl?.trim()) {
                for await (const chunk of GeneralAgent(sessionId, Query)) {
                    yield chunk;
                }
                return;
            }

            return yield* CodeAnalyzerAgent(sessionId, Query, repoUrl);
        }

        const llm = await llmPromise;
        const result = await llm.invoke(RouterPrompt);

        let raw = result.content as string;
        raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        let intent: Intent = "General";

        try {
            const jsonMatch = raw.match(/\{[^}]+\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const validIntents: Intent[] = ["code_analyzer", "summarizer", "debugger", "Rag_Agent", "General"];
                if (parsed.intent && validIntents.includes(parsed.intent)) {
                    intent = parsed.intent;
                }
            }
        } catch (parseErr) {
            console.error("[Router] Failed to parse intent JSON:", raw);
        }

        console.log("Intent:", intent);

        if (REPO_DEPENDENT_INTENTS.includes(intent) && !repoUrl?.trim()) {
            for await (const chunk of GeneralAgent(sessionId, Query)) {
                yield chunk;
            }
            return;
        }

        switch (intent) {
            case "code_analyzer":
                return yield* CodeAnalyzerAgent(sessionId, Query, repoUrl);

            case "summarizer":
                return yield* SummarizerAgent(sessionId, Query, repoUrl);

            case "debugger":
                return yield* DebuggerAgent(sessionId, Query, repoUrl);

            case "Rag_Agent":
                return yield* Rag_Agent(sessionId, Query, repoUrl);

            default:
                return yield* GeneralAgent(sessionId, Query);
        }
    } catch (error: any) {
        console.error("Router Error:", error);

        if (error?.name === "LLMServiceUnavailableError") {
            yield error.message;
            return;
        }

        if (error?.status === 429) {
            yield "AI service is busy right now. Please Wait 30 seconds and try again!!";
            return;
        }

        if (error?.status === 503) {
            yield "AI service is temporarily unavailable. Please try again shortly!!";
            return;
        }

        yield "Something went wrong while processing your request. Please try again.";
    }
}

export default Router;