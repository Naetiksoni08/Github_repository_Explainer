import llm from "..";
import CodeAnalyzerAgent from "./Code.agent";
import DebuggerAgent from "./Debugger.agent";
import GeneralAgent from "./General.agent";
import Rag_Agent from "./Rag.agent";
import SummarizerAgent from "./Summary.agent";



type Intent = "code_analyzer" | "summarizer" | "debugger" | "Rag_Agent" | "General"

async function* Router(sessionId: string, Query: string,repoUrl:string): AsyncGenerator<string> {

    const CombinedQuery = `
Rewrite the following user query to be more specific and detailed and also Analyze the query and return ONLY one of these 
words:  
  "code_analyzer" → user wants code explained, analyzed, or walked through line by line
  "summarizer"    → user asks for overview, summary, or what the repo/file does                                                             
  "debugger"      → user asks about bugs, errors, or how to fix something                                                                   
  "Rag_Agent"     → any question about the repository, its files, structure, or behavior                                                    
  "General"       → ONLY for questions completely unrelated to a repository                                                                 
                    (e.g. "write me a sorting algorithm", "explain recursion")                                                              
                    If in doubt, use Rag_Agent       

Instructions: (IMPORTANT)
 Return ONLY valid JSON, no explanation:
{"rewrittenQuery": "...", "intent": "one of the 5 keywords"}      

Query: ${Query}
`;

    const FinalQuery = await llm.invoke(CombinedQuery);

    try {
        const { rewrittenQuery, intent }: { rewrittenQuery: string, intent: Intent } = JSON.parse(FinalQuery.content as string)

        if (intent === "code_analyzer") {
            return yield* CodeAnalyzerAgent(sessionId, rewrittenQuery,repoUrl);
        } else if (intent === "summarizer") {
            return yield* SummarizerAgent(sessionId, rewrittenQuery,repoUrl)
        } else if (intent === "debugger") {
            return yield* DebuggerAgent(sessionId, rewrittenQuery,repoUrl)
        } else if (intent === "Rag_Agent") {
            return yield* Rag_Agent(sessionId, rewrittenQuery,repoUrl)
        } else {
            return yield* GeneralAgent(sessionId, rewrittenQuery);
        }
    } catch (error) {
        return yield* GeneralAgent(sessionId, Query);
    }

}

export default Router;