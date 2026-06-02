import { getMessages } from "./memory";
import retriever from "../retriever/retriever";
import llm from "..";

async function* DebuggerAgent(sessionId: string, cleanquery: string, repoUrl: string): AsyncGenerator<string> {
  const getHistory = await getMessages(sessionId);
  const chunks = await retriever(cleanquery, repoUrl)
  const chunkContent = chunks.map((doc: any) => doc.pageContent).join("\n\n")

  const prompt = `
You are an expert software debugger.

CHAT HISTORY:
${JSON.stringify(getHistory)}

RELEVANT CODE CONTEXT:
${chunkContent}

USER QUESTION:
${cleanquery}

Rules:

- Identify the most likely root cause.
- Focus on solving the problem.
- Use repository context when relevant.
- Do not make up information.
- If there is not enough context, clearly say so.
- Avoid unnecessary theory.
- Avoid long explanations.
- Do not add introductions or greetings.
- Do not add conclusions.
- Do not suggest unrelated improvements.

Response Style:

- Be direct and action-oriented.
- Focus on the root cause and fix.
- Do not explain unrelated concepts unless asked.
- Match the depth of the response to the user's request.

Formatting:

- Root Cause: short explanation.
- Fix: short explanation.
- Code: only if needed.
- Use inline code for functions, files, variables, and classes.
- Use code blocks only when showing actual code.

Keep responses under 150 words unless the user requests more detail.
`;

  const stream = await llm.stream(prompt);
  for await (const chunk of stream) {
    yield chunk.content as string
  }

}

export default DebuggerAgent;