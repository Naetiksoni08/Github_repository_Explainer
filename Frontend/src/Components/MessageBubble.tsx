import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'
import api from '../utils/axios'
import CodeBlock from './CodeBlock'
import { FiCheck, FiEdit, FiCopy, FiRefreshCw } from "react-icons/fi"

interface MessageBubbleProps {
    msg: any
    index: number
    messages: any[]
    sessionId: string
    setMessages: React.Dispatch<React.SetStateAction<any[]>>
    editingIndex: number | null
    setEditingIndex: (index: number | null) => void
    editValue: string
    setEditValue: (val: string) => void
    copiedIndex: number | null
    setCopiedIndex: (index: number | null) => void
    handleRetry: (index: number) => Promise<any>
    handleSend: (text?: string) => Promise<any>
}

const markdownComponents = {
    code({ className, children }: any) {
        return (
            <CodeBlock className={className}>
                {children}
            </CodeBlock>
        )
    },
    a({ href, children }: any) {
        return (
            <a
                href={href}
                target='_blank'
                rel="noopener noreferrer"
                className='markdown-link'
            >
                {children}
            </a>
        )
    }
}

const MessageBubble = ({
    msg,
    index,
    messages,
    sessionId,
    setMessages,
    editingIndex,
    setEditingIndex,
    editValue,
    setEditValue,
    copiedIndex,
    setCopiedIndex,
    handleRetry,
    handleSend
}: MessageBubbleProps) => {
    const isEditing = editingIndex === index

    const handleCopy = () => {
        navigator.clipboard.writeText(msg.content)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }

    return (
        <div className={`message ${msg.role}`}>
            {isEditing ? (
                <div className="inline-edit-box">
                    <textarea
                        className="inline-edit-textarea"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                        rows={Math.min(10, editValue.split("\n").length + 1)}
                    />
                    <div className="inline-edit-actions">
                        <button className="inline-edit-cancel" onClick={() => setEditingIndex(null)}>
                            Cancel
                        </button>
                        <button
                            className="inline-edit-save"
                            disabled={!editValue.trim()}
                            onClick={async () => {
                                const trimmed = editValue.trim()
                                await handleRetry(index)
                                setEditingIndex(null)
                                await handleSend(trimmed)
                            }}
                        >
                            Save & Submit
                        </button>
                    </div>
                </div>
            ) : msg.role === "user" ? (
                <div className="message-bubble">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {msg.content}
                    </ReactMarkdown>
                </div>
            ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {msg.content}
                </ReactMarkdown>
            )}

            {!isEditing && msg.interrupted && (
                <div className="interrupted-card">
                    <div className="interrupted-card-text">
                        <span className="interrupted-dot" />
                        <span>Response was interrupted</span>
                    </div>
                    {!msg.dismissed && (
                        <div className="interrupted-card-actions">
                            <button
                                className="interrupted-try-again"
                                onClick={async () => {
                                    const lastUserMsg = messages[index - 1]
                                    if (lastUserMsg?.role !== "user") return
                                    if (!lastUserMsg.timestamp) {
                                        toast.error("Can't retry this message — missing data")
                                        return
                                    }
                                    try {
                                        await handleRetry(index - 1)
                                        await handleSend(lastUserMsg.content)
                                    } catch {
                                    }
                                }}
                            >
                                <FiRefreshCw size={12} />
                                Try again
                            </button>
                            <button
                                className="interrupted-no-thanks"
                                onClick={async () => {
                                    await api.patch(`/api/sessions/${sessionId}/dismiss-interrupt`,
                                        { timestamp: msg.timestamp },
                                        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                                    )
                                    setMessages(prev => {
                                        const updated = [...prev]
                                        updated[index] = { ...updated[index], dismissed: true }
                                        return updated
                                    })
                                }}
                            >
                                No thanks
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!isEditing && msg.errored && (
                <div className="error-retry-row">
                    <span className="interrupted-text">Something went wrong generating this response.</span>
                    <button className="retry-error-btn" onClick={() => handleRetry(index - 1)}>
                        <FiRefreshCw size={14} />
                        <span>Retry</span>
                    </button>
                </div>
            )}

            {!isEditing && msg.role === "user" && (
                <div className="message-actions">
                    <button data-tooltip="Copy" onClick={handleCopy}>
                        {copiedIndex === index ? <FiCheck size={14} /> : <FiCopy size={14} />}
                        <span>Copy</span>
                    </button>

                    <button data-tooltip="Edit" onClick={() => {
                        setEditingIndex(index)
                        setEditValue(msg.content)
                    }}>
                        <FiEdit size={14} />
                        <span>Edit</span>
                    </button>

                    <button data-tooltip="Retry" onClick={() => handleRetry(index)}>
                        <FiRefreshCw size={14} />
                        <span>Retry</span>
                    </button>
                </div>
            )}

            {!isEditing && msg.role === "assistant" && msg.content && (
                <div className="message-footer">
                    {msg.timestamp && (
                        <span className="message-time">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <button className="footer-copy-btn" data-tooltip="Copy" onClick={handleCopy}>
                        {copiedIndex === index ? <FiCheck size={15} /> : <FiCopy size={15} />}
                    </button>
                </div>
            )}
        </div>
    )
}

export default MessageBubble