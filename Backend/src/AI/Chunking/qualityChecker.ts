import { Document } from "@langchain/core/documents";


function qualitychunker(docs: Document[]): [Document[], Document[]] {
    const MIN_CHARS = 140;
    const MAX_CHARS = 1500;
    const importantConfigPatterns = [
        "docker-compose",
        "dockerfile",
        "nginx",
        "k8s",
        "kubernetes",
        ".yml",
        ".yaml",
        ".env",
        "pom.xml",
        "application.properties",
        "readme"
    ];

    const GoodChunk = docs.filter((doc) => {
        const text = doc.pageContent.trim();
        const source = String(doc.metadata?.source || "").toLowerCase();
        const isImportantConfigFile = importantConfigPatterns.some((pattern) =>
            source.includes(pattern)
        );

        // Keep important infra/config files even when they are short.
        if (isImportantConfigFile) {
            return text.length >= 40 && text.length <= 5000;
        }

        if (text.length < MIN_CHARS || text.length > MAX_CHARS) return false;

        const lines = text.split("\n").filter((line) => line.trim().length > 0).length;
        const codeSignal = (text.match(/[{}()[\];=<>]/g) || []).length;
        const alphaNum = (text.match(/[a-zA-Z0-9]/g) || []).length;
        const density = alphaNum / text.length;

        // Reject overly sparse/noisy chunks so retrieval remains high-signal.
        return lines >= 3 && codeSignal >= 3 && density >= 0.35;
    });

    const BadChunk = docs.filter((doc) => !GoodChunk.includes(doc));

    return [GoodChunk, BadChunk];
}

export default qualitychunker;