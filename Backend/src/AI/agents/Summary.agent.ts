import { getMessages } from "./memory";
import retriever from "../retriever/retriever";
import llm from "..";

async function* SummarizerAgent(sessionId: string, cleanquery: string, repoUrl: string): AsyncGenerator<string> {
    const getHistory = await getMessages(sessionId);
    const chunks = await retriever(cleanquery, repoUrl)
    const chunkContent = chunks.map((doc: any) => doc.pageContent).join("\n\n")

    const prompt = `You are an expert summarizer.

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
    - Provide a concise, clear summary
    - Highlight key points only
    - Avoid unnecessary details
    - Can summarize: repo overview, specific code block, or chat history

- Before each section, write a relevant heading using markdown ## (NOT bold, NOT strong)
- Example: Instead of "**Overview:**", write "## What does this repository do?" then answer
- Example: Instead of "**Key Points:**", write "## Key highlights" then answer
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

export default SummarizerAgent;