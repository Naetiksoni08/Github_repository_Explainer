const MAX_CONTEXT_CHARS = 3000; // cap on repo/code chunk content specifically

function truncateContext(content: string, maxChars: number = MAX_CONTEXT_CHARS): string {
    if (content.length <= maxChars) return content;
    return content.slice(0, maxChars) + "\n\n[...context truncated due to length]";
}

export { truncateContext };