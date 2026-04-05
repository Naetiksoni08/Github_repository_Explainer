import { getMessages } from "./memory";
import llm from "..";

async function* GeneralAgent(sessionId: string, cleanquery: string): AsyncGenerator<string> {
    const getHistory = await getMessages(sessionId);

    const prompt = `                                                                                                                                  
    - You are a helpful general-purpose assistant
    - Answer ANY question the user asks                                                                                                     
    - If they ask for code, write it in the requested language                                                                              
    - If they ask something general, answer it helpfully      
    - No repo context needed (don't use retriever)                                                                                          
    - Use chat history for context 

    CHAT HISTORY:
    ${JSON.stringify(getHistory)}
    
    USER QUESTION:
    ${cleanquery}

`
    const stream = await llm.stream(prompt);
    for await (const chunk of stream) {
        yield chunk.content as string
    }
}

export default GeneralAgent;