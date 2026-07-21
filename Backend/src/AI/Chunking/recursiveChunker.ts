import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

// Maps file extensions -> LangChain's supported `fromLanguage` identifiers.
// Anything not in this map falls back to a plain (no-language) splitter.
const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
    ".js": "js",
    ".jsx": "js",
    ".ts": "js",
    ".tsx": "js",
    ".py": "python",
    ".java": "java",
    ".go": "go",
    ".rs": "rust",
    ".rb": "ruby",
    ".php": "php",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".c": "cpp",
    ".cs": "csharp",
    ".swift": "swift",
    ".scala": "scala",
    ".sol": "sol",
    ".proto": "proto",
    ".html": "html",
    ".md": "markdown",
    ".markdown": "markdown",
    ".rst": "rst",
    ".tex": "latex"
};

function getExtension(source: string): string {
    const clean = source.toLowerCase().split("?")[0];
    const match = clean.match(/(\.[a-z0-9]+)$/);
    return match ? match[1] : "";
}

function getSplitterForFile(source: string): RecursiveCharacterTextSplitter {
    const ext = getExtension(source);
    const language = EXTENSION_LANGUAGE_MAP[ext];

    if (language) {
        try {
            return RecursiveCharacterTextSplitter.fromLanguage(language as any, {
                chunkSize: 700,
                chunkOverlap: 120
            });
        } catch {
            // Falls through to plain splitter if langchain doesn't recognize it.
        }
    }

    // Plain-text / config / unknown files (.yml, .json, .env, Dockerfile, etc.)
    // use generic separators instead of a language grammar.
    return new RecursiveCharacterTextSplitter({
        chunkSize: 700,
        chunkOverlap: 120,
        separators: ["\n\n", "\n", " ", ""]
    });
}

async function recursivechunker(docs: Document[]): Promise<Document[]> {
    const normalizedDocs = docs
        .map((doc) => {
            const cleaned = doc.pageContent
                .replace(/\r\n/g, "\n")
                .replace(/[ \t]+\n/g, "\n")
                .trim();

            return new Document({
                pageContent: cleaned,
                metadata: doc.metadata
            });
        })
        .filter((doc) => doc.pageContent.length > 0);

    const allChunks: Document[] = [];

    // Each file gets its own splitter instance since fromLanguage() is per-language.
    for (const doc of normalizedDocs) {
        const source = String(doc.metadata?.source || "");
        const splitter = getSplitterForFile(source);
        const chunks = await splitter.splitDocuments([doc]);
        allChunks.push(...chunks);
    }

    return allChunks;
}

export default recursivechunker;