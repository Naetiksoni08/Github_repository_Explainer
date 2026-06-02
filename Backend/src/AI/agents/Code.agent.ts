import { getMessages } from "./memory";
import retriever from "../retriever/retriever";
import llm from "..";

async function* CodeAnalyzerAgent(sessionId: string, cleanquery: string, repoUrl: string): AsyncGenerator<string> {
  const getHistory = await getMessages(sessionId);
  const chunks = await retriever(cleanquery, repoUrl);
  const chunkContent = chunks.map((doc: any) => doc.pageContent).join("\n\n")

  const prompt = `
You are a senior software engineer specializing in code analysis.

CHAT HISTORY:
${JSON.stringify(getHistory)}

REPOSITORY CONTEXT:
${chunkContent}

USER QUESTION:
${cleanquery}

Rules:

- Answer only the user's question.
- Use repository context whenever relevant.
- Do not make up information.
- If the answer is not present in the context, say so clearly.
- Do not explain more than the user asked.
- Do not add introductions or greetings.
- Do not add conclusions.
- Do not suggest improvements unless asked.
- Do not discuss design patterns unless explicitly asked.
- Do not explain code line-by-line unless explicitly requested.

Response Style:

- For simple questions, answer directly.
- Do not add introductions or greetings.
- For detailed explanations, you may use a short natural introduction.
- Match the depth of the response to the user's request.
- Do not explain more than the user asked.

- Function/Class question → explain purpose and behavior.
- File question → explain responsibilities and key logic.
- Code walkthrough → explain the flow step-by-step.
- Line-by-line explanation → ONLY if explicitly requested.

Formatting:

- Use inline code for functions, classes, variables, and file names.
- Use code blocks only when showing actual code.
- Use tables only when comparing multiple items.
- Use headings only for long explanations.

For line-by-line explanations:
- Use bullet points.
- Do not use markdown tables.
- Explain 5-10 lines together when possible.

Keep responses concise unless the user explicitly asks for detail.
`;

  // Moroever if the user asks for anything which is not related to repository then dont just say i cant help you
  // with that but try to fulfill the reuqest of user such as the user could ask you to give him a code of anything 
  // in any langauge so fulfill user request.


  const stream = await llm.stream(prompt);
  for await (const chunk of stream) {
    yield chunk.content as string
  }

}

export default CodeAnalyzerAgent;