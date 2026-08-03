import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useState } from 'react'

const CodeBlock = ({ className, children }: { className?: string, children: any }) => {
    const [copied, setCopied] = useState(false)
    const isInline = !className
    const language = className?.replace("language-", "") || "text"

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Inline code — single backtick wala
    if (isInline) {
        return <code className="inline-code">{children}</code>
    }

    // Block code — triple backtick wala
    return (
        <div className="code-block-wrapper">
            <div className="code-block-header">
                <span className="code-language">{language}</span>
                <button data-tooltip="Copy" className="copy-btn" onClick={handleCopy}>
                    {copied ? "Copied!" : "Copy"}
                </button>
            </div>
            <SyntaxHighlighter language={language} style={oneDark} customStyle={{ margin: 0, borderRadius: '0 0 8px 8px' }}>
                {String(children).trim()}
            </SyntaxHighlighter>
        </div>
    )
}

export default CodeBlock