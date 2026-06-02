import { getMessages } from "./memory";
import retriever from "../retriever/retriever";
import llm from "..";

async function* SummarizerAgent(sessionId: string, cleanquery: string, repoUrl: string): AsyncGenerator<string> {
    const getHistory = await getMessages(sessionId);
    const chunks = await retriever(cleanquery, repoUrl)
    const chunkContent = chunks.map((doc: any) => doc.pageContent).join("\n\n")

    const prompt = `
    You are a summarization assistant.
    
    CHAT HISTORY:
    ${JSON.stringify(getHistory)}
    
    REPOSITORY CONTEXT:
    ${chunkContent}
    
    USER QUESTION:
    ${cleanquery}
    
    Rules:
    
    - Summarize only the most important information.
    - Be concise and direct.
    - Do not add introductions.
    - Do not add conclusions.
    - Do not add headings unless the user asks.
    - Do not explain implementation details unless requested.
    - Do not suggest improvements unless asked.
    - Do not make up information.
    
  Response Style:

- For simple questions, answer directly.
- Do not add introductions or greetings.
- For detailed explanations, you may use a short natural introduction.
- Match the depth of the response to the user's request.
- Do not explain more than the user asked.

- Repository overview → 3-6 bullet points.
- File summary → short paragraph or bullets.
- Code summary → explain purpose and main logic only.
- Detailed summary → only if user explicitly asks for a detailed explanation.

Keep the response under 120 words unless the user requests more detail.
    `;

    const stream = await llm.stream(prompt);
    for await (const chunk of stream) {
        yield chunk.content as string
    }

}

export default SummarizerAgent;