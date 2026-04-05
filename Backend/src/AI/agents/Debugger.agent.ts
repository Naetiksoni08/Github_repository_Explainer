import { getMessages } from "./memory";
import retriever from "../retriever/retriever";
import llm from "..";

async function* DebuggerAgent(sessionId: string, cleanquery: string,repoUrl:string): AsyncGenerator<string>{
    const getHistory = await getMessages(sessionId);
    const chunks = await retriever(cleanquery,repoUrl)
    const chunkContent = chunks.map((doc: any) => doc.pageContent).join("\n\n")

    const prompt = `You are an expert Debugger.

    CHAT HISTORY:
    ${JSON.stringify(getHistory)}
    
    RELEVANT CODE CONTEXT:
    ${chunkContent}
    
    USER QUESTION:
    ${cleanquery}

    Before responding, ALWAYS start with one short friendly line like:
- "Here's what you asked for! 🚀"
- "Sure! Here's the code along with a brief explanation:"
- "Got it! Here's a detailed breakdown:"

Then give your actual response.

    
    Instructions:
    - Find bugs and errors in the code
    - Explain the root cause due to which the bug exists
    - Avoid unnecessary details
    - Suggest fixes to the bug with code example

- Before each section, add a relevant question as a heading using markdown bold
- Example: Instead of just "Purpose: ...", write "**What is the purpose of this repository?**" then answer
- Example: Instead of "Functionalities: ...", write "**What does this repository do?**" then answer
    
   Return a SHORT, direct answer. Less is more.`

   const stream = await llm.stream(prompt);
   for await(const chunk of stream) {
     yield chunk.content as string
   }

}

export default DebuggerAgent;