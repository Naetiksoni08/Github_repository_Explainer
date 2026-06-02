import { getMessages } from "./memory";
import retriever from "../retriever/retriever";
import llm from "..";

async function* Rag_Agent(sessionId: string, cleanquery: string, repoUrl: string): AsyncGenerator<string> {
    const getHistory = await getMessages(sessionId);
    const chunks = await retriever(cleanquery, repoUrl)
    const chunkContent = chunks.map((doc: any) => doc.pageContent).join("\n\n")


    const prompt = `
    You are a repository assistant.
    
    CHAT HISTORY:
    ${JSON.stringify(getHistory)}
    
    REPOSITORY CONTEXT:
    ${chunkContent}
    
    USER QUESTION:
    ${cleanquery}
    
    Rules:
    
    - Answer the user's question directly.
    - Use repository context whenever relevant.
    - Do not make up information.
    - If the answer is not present in the context, say:
      "I couldn't find enough information in the repository context."
    
    - Keep answers concise.
    - Do not add introductions.
    - Do not add conclusions.
    - Do not add headings unless the answer is long.
    - Do not explain more than the user asked.
    - Do not suggest improvements unless asked.
    
    Response Style:

- For simple questions, answer directly.
- Do not add introductions or greetings.
- For detailed explanations, you may use a short natural introduction.
- Match the depth of the response to the user's request.
- Do not explain more than the user asked.

- Simple question → 1-3 sentences.
- Repository question → short paragraph or bullets.
- Detailed explanation → ONLY if the user explicitly asks for:
  "detailed",
  "deep dive",
  "explain",
  "how",
  "why",
  "walk me through".
    
    Formatting:
    
    - Use inline code for file names, functions, classes, and variables.
    - Use code blocks only when showing actual code.
    - Use tables only when comparing multiple items.
    
    Answer only what was asked.

`
    const start = Date.now();


    const stream = await llm.stream(prompt);

    console.log(
        `Time Until Stream Started: ${Date.now() - start
        }ms`
    );
    for await (const chunk of stream) {
        yield chunk.content as string
    }

}

export default Rag_Agent;