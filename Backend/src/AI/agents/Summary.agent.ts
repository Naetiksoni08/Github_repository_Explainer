import { getMessages } from "./memory";
import retriever from "../retriever/retriever";
import llm from "..";

async function SummarizerAgent(sessionId: string, cleanquery: string): Promise<string> {
    const getHistory = await getMessages(sessionId);
    const retrieverInstance = await retriever()
    const chunks = await retrieverInstance.invoke(cleanquery)
    const chunkContent = chunks.map(doc => doc.pageContent).join("\n\n")

    const prompt = `You are an expert summarizer.

    CHAT HISTORY:
    ${JSON.stringify(getHistory)}
    
    RELEVANT CODE CONTEXT:
    ${chunkContent}
    
    USER QUESTION:
    ${cleanquery}
    
    Instructions:
    - Provide a concise, clear summary
    - Highlight key points only
    - Avoid unnecessary details
    - Can summarize: repo overview, specific code block, or chat history
    
    Return a clean, structured summary.`

    const response = await llm.invoke(prompt);
    return response.content as string;

}

export default SummarizerAgent;