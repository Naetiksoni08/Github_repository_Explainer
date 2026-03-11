import llm from "..";
import CodeAnalyzerAgent from "./Code.agent";
import DebuggerAgent from "./Debugger.agent";
import Rag_Agent from "./Rag.agent";
import SummarizerAgent from "./Summary.agent";



type Intent = "code_analyzer" | "summarizer" | "debugger" | "Rag_Agent" | "irrelevant"

async function Router(sessionId: string, Query: string): Promise<string> {
    const rewritequery = `You are a query rewriting assistant.
Rewrite the following user query to be more specific and detailed.
Return ONLY the rewritten query, no explanation.
Query: ${Query}`;

    const rewrittenquery = await llm.invoke(rewritequery);
    const cleanquery = rewrittenquery.content as string

    const intentdetector = `You are an intent detector.
Analyze the query and return ONLY one of these words:
"code_analyzer", "summarizer", "debugger", "Rag_Agent", "irrelevant"

Query: ${cleanquery}`

    const intentrespone = await llm.invoke(intentdetector);
    const intent = intentrespone.content as Intent;
    const cleanIntent = intent.trim().replace(/['"]/g, "") as Intent


    if (cleanIntent === "code_analyzer") {
        return await CodeAnalyzerAgent(sessionId, cleanquery);
    } else if (cleanIntent === "summarizer") {
        return await SummarizerAgent(sessionId, cleanquery)
    } else if (cleanIntent === "debugger") {
        return await DebuggerAgent(sessionId, cleanquery)
    } else if (cleanIntent === "Rag_Agent") {
        return await Rag_Agent(sessionId, cleanquery)
    } else {
        return "I only answer questions about the provided repository"
    }

}

export default Router;