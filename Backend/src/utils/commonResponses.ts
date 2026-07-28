const COMMON_RESPONSES: { keywords: string[]; response: string }[] = [
    { keywords: ["what are you", "who are you"], response: "I'm CodeLens AI — an assistant that helps you understand GitHub repositories. Paste a repo URL and ask me anything about the code, architecture, or errors." },
    { keywords: ["what can you do", "what do you do", "your capabilities"], response: "I can ingest a GitHub repository and help you: explain code and functions, summarize the project, debug errors, and answer architecture/behavior questions about the codebase." },
    { keywords: ["who made you", "who created you", "who built you"], response: "I'm a custom-built coding assistant designed to analyze GitHub repositories and answer programming questions." },
    { keywords: ["are you chatgpt", "are you gpt", "are you claude", "are you gemini"], response: "No, I'm CodeLens AI — a purpose-built assistant for repository analysis, running on free LLM models." },
    { keywords: ["hi", "hello", "hey", "yo"], response: "Hey! Paste a GitHub repo URL to get started, or ask me a coding question directly." },
    { keywords: ["good morning"], response: "Good morning! Paste a GitHub repo URL whenever you're ready, or ask me a coding question." },
    { keywords: ["good night"], response: "Good night! Come back anytime you want to dig into a repo." },
    { keywords: ["thank you", "thanks", "thankyou"], response: "You're welcome! Let me know if you have more questions." },
    { keywords: ["how are you"], response: "I'm doing well, thanks for asking! Ready to help — paste a repo URL or ask a coding question." },
    { keywords: ["bye", "goodbye", "see you"], response: "See you around! Come back anytime you want to explore another repo." },
    { keywords: ["are you free", "is this free", "do i need to pay", "pricing"], response: "Yes, this tool is free to use and runs on free-tier LLM models." },
    { keywords: ["what languages do you support", "which languages", "programming languages you support"], response: "I can work with code in any programming language — the repository content itself determines what I analyze." },
    { keywords: ["can you write code", "can you code", "do you write code"], response: "Yes — I can write code, explain existing code, help with debugging, and assist with LeetCode/DSA problems too." },
    { keywords: ["what is this website", "what is this app", "what is this tool", "what is this platform"], response: "This is CodeLens AI — paste any GitHub repository URL and I'll help you understand, summarize, and debug the codebase." },
    { keywords: ["how does this work", "how do i use this", "how to use"], response: "Just paste a GitHub repository URL to begin. Once it's ingested, ask me anything — code explanations, summaries, debugging help, or architecture questions." },
    { keywords: ["are you open source", "is this open source"], response: "I can't speak to the project's licensing — check the repository/README for that detail." },
    { keywords: ["do you remember me", "do you have memory", "do you remember our conversation"], response: "I remember the conversation within this session, but I don't retain anything once you start a new chat." },
    { keywords: ["are you a bot", "are you human", "are you real"], response: "I'm an AI assistant, not a human — built specifically to help with code and repository analysis." },
    { keywords: ["what model are you", "which llm", "what llm do you use"], response: "I run on free-tier models via OpenRouter, with automatic fallback between a few options for reliability." },
    { keywords: ["can i trust you", "are you accurate", "are you reliable"], response: "I do my best to stay accurate based on the repository context provided, but always double-check critical code changes yourself." },
];
function normalizeForMatch(query: string): string {
    return query.trim().toLowerCase().replace(/[?.!]+$/g, "");
}

function matchesKeyword(normalized: string, keyword: string): boolean {
    // Multi-word keywords ("who are you") ko phrase match chahiye,
    // single-word keywords ("hi") ko word-boundary match chahiye
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escaped}\\b`);
    return pattern.test(normalized);
}

function getCommonResponse(query: string): string | null {
    const normalized = normalizeForMatch(query);

    if (normalized.length > 60) return null;

    for (const entry of COMMON_RESPONSES) {
        if (entry.keywords.some((kw) => normalized === kw || matchesKeyword(normalized, kw))) {
            return entry.response;
        }
    }
    return null;
}
export { getCommonResponse };