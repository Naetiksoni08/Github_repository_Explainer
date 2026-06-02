import llm from "..";
import CodeAnalyzerAgent from "./Code.agent";
import DebuggerAgent from "./Debugger.agent";
import GeneralAgent from "./General.agent";
import Rag_Agent from "./Rag.agent";
import SummarizerAgent from "./Summary.agent";


type Intent = "code_analyzer" | "summarizer" | "debugger" | "Rag_Agent" | "General"

async function* Router(sessionId: string, Query: string, repoUrl: string): AsyncGenerator<string> {

    console.log("Router called with query:", Query);

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

            return yield* DebuggerAgent(
                sessionId,
                Query,
                repoUrl
            );
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

            return yield* SummarizerAgent(
                sessionId,
                Query,
                repoUrl
            );
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

            return yield* CodeAnalyzerAgent(
                sessionId,
                Query,
                repoUrl
            );
        }
        const result = await llm.invoke(RouterPrompt);

        let raw = result.content as string;
        raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const { intent }: { intent: Intent } = JSON.parse(raw);

        console.log("Intent:", intent)


        switch (intent) {
            case "code_analyzer":
                return yield* CodeAnalyzerAgent(
                    sessionId,
                    Query,
                    repoUrl
                );

            case "summarizer":
                return yield* SummarizerAgent(
                    sessionId,
                    Query,
                    repoUrl
                );

            case "debugger":
                return yield* DebuggerAgent(
                    sessionId,
                    Query,
                    repoUrl
                );

            case "Rag_Agent":
                return yield* Rag_Agent(
                    sessionId,
                    Query,
                    repoUrl
                );

            default:
                return yield* GeneralAgent(
                    sessionId,
                    Query
                );
        }
    } catch (error) {
        console.error("Router Error:", error);

        return yield* GeneralAgent(
            sessionId,
            Query
        );
    }
}

export default Router;
