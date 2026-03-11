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

    Instructions: 
      - Analyze the code thoroughly
      - Explain what the code does line by line if needed
      - Mention design patterns if any
      - Keep explanation clear and structured
    Return a detailed, well-structured code analysis.`


  const response = await llm.invoke(prompt);
  return response.content as string;

}

export default CodeAnalyzerAgent;