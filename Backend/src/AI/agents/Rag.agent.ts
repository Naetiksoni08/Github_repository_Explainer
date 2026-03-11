import { getMessages } from "./memory";
import retriever from "../retriever/retriever";
import llm from "..";

async function Rag_Agent(sessionId: string, cleanquery: string): Promise<string> {
    const getHistory = await getMessages(sessionId);
    const chunks = await retriever(cleanquery)
    const chunkContent = chunks.map((doc: any) => doc.pageContent).join("\n\n")


    const prompt = `You are an expert AI assistant for GitHub repositories.

    CHAT HISTORY:
    ${JSON.stringify(getHistory)}
    
    RELEVANT CODE CONTEXT:
    ${chunkContent}
    
    USER QUESTION:
    ${cleanquery}
    
    Instructions:
    - Answer based on the repository context provided
    - Be clear and concise
    - If answer is not in the context, honestly say "I couldn't find this in the repository"
    - Do not make up information
    
    Return a clear, helpful answer.`

    const response = await llm.invoke(prompt);
    return response.content as string;

}

export default Rag_Agent;