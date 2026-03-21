import { getMessages } from "./memory";
import retriever from "../retriever/retriever";
import llm from "..";

async function CodeAnalyzerAgent(sessionId: string, cleanquery: string): Promise<string> {
  const getHistory = await getMessages(sessionId);
  const chunks = await retriever(cleanquery);
  const chunkContent = chunks.map((doc: any) => doc.pageContent).join("\n\n")

  const prompt = `You are a senior software engineer specializing in code analysis.

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
      - Analyze the code thoroughly
      - Explain what the code does line by line if needed
      - Mention design patterns if any
      - Keep explanation clear and structured

- Before each section, add a relevant question as a heading using markdown bold
- Example: Instead of just "Purpose: ...", write "**What is the purpose of this repository?**" then answer
- Example: Instead of "Functionalities: ...", write "**What does this repository do?**" then answer

CRITICAL FORMATTING RULES - FOLLOW EXACTLY:
- NEVER wrap single words, variable names, or short phrases in code blocks
- Code blocks (triple backticks) ONLY for complete runnable code snippets (3+ lines)
- For inline mentions like function names use single backticks: \`fetchMovies\`
- NEVER number every single line with a code block explanation
- Give code ONCE, then explain briefly in plain text
- Maximum response length: concise and to the point
- DO NOT add "Design Patterns", "Important Considerations", "Key Improvements" sections unless explicitly asked

  Return a SHORT, direct answer. Less is more.`

  // Moroever if the user asks for anything which is not related to repository then dont just say i cant help you
  // with that but try to fulfill the reuqest of user such as the user could ask you to give him a code of anything 
  // in any langauge so fulfill user request.


  const response = await llm.invoke(prompt);
  return response.content as string;

}

export default CodeAnalyzerAgent;