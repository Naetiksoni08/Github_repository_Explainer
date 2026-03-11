import { getMessages } from "./memory";
import retriever from "../retriever/retriever";
import llm from "..";

async function DebuggerAgent(sessionId: string, cleanquery: string): Promise<string> {
    const getHistory = await getMessages(sessionId);
    const chunks = await retriever(cleanquery)
    const chunkContent = chunks.map((doc: any) => doc.pageContent).join("\n\n")

    const prompt = `You are an expert Debugger.

    CHAT HISTORY:
    ${JSON.stringify(getHistory)}
    
    RELEVANT CODE CONTEXT:
    ${chunkContent}
    
    USER QUESTION:
    ${cleanquery}
    
    Instructions:
    - Find bugs and errors in the code
    - Explain the root cause due to which the bug exists
    - Avoid unnecessary details
    - Suggest fixes to the bug with code example
    
    Return a clean, structured Result.`

    const response = await llm.invoke(prompt);
    return response.content as string;

}

export default DebuggerAgent;