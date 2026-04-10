import { getMessages } from "./memory";
import retriever from "../retriever/retriever";
import llm from "..";

async function* Rag_Agent(sessionId: string, cleanquery: string,repoUrl:string): AsyncGenerator<string> {
    const getHistory = await getMessages(sessionId);
    const chunks = await retriever(cleanquery,repoUrl)
    const chunkContent = chunks.map((doc: any) => doc.pageContent).join("\n\n")


    const prompt = `You are an expert AI assistant for GitHub repositories.

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
    - Answer based on the repository context provided
    - Be clear and concise
    - If answer is not in the context, honestly say "I couldn't find this in the repository"
    - Do not make up information


- Before each section, write a relevant heading using markdown ## (NOT bold, NOT strong)
- Example: Instead of "**Purpose:**", write "## What is the purpose of this repository?" then answer
- Example: Instead of "**Functionalities:**", write "## What does this repository do?" then answer
- NEVER use **bold** for section headings — always use ## or ### markdown headings


CRITICAL FORMATTING RULES - FOLLOW EXACTLY:
- NEVER wrap single words, variable names, or short phrases in code blocks
- Code blocks (triple backticks) ONLY for complete runnable code snippets (3+ lines)
- For inline mentions like function names use single backticks: \`fetchMovies\`
- NEVER number every single line with a code block explanation
- Give code ONCE, then explain briefly in plain text
- Maximum response length: concise and to the point
- DO NOT add "Design Patterns", "Important Considerations", "Key Improvements" sections unless explicitly asked
   Return a SHORT, direct answer. Less is more.`

    const stream = await llm.stream(prompt);
    for await (const chunk of stream) {
        yield chunk.content as string
    }

}

export default Rag_Agent;