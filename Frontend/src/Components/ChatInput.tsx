import { FiSend, FiSquare, FiMic, FiFileText } from "react-icons/fi"
import { IoClose } from 'react-icons/io5'

interface ChatInputProps {
    textareaRef: React.RefObject<HTMLTextAreaElement | null>
    pastedFiles: any[]
    setPreviewFile: (file: any) => void
    removePastedFile: (id: string) => void
    handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void
    handleSend: (text?: string) => Promise<any>
    handleAbort: () => void
    isHardLimit: boolean
    repoIngested: boolean
    displayValue: string
    input: string
    setInput: (val: string) => void
    isListening: boolean
    interimText: string
    handleMicClick: () => void
    loading: boolean
    previewFile: any
}

const ChatInput = ({
    textareaRef,
    pastedFiles,
    setPreviewFile,
    removePastedFile,
    handlePaste,
    handleSend,
    handleAbort,
    isHardLimit,
    repoIngested,
    displayValue,
    input,
    setInput,
    isListening,
    interimText,
    handleMicClick,
    loading,
    previewFile
}: ChatInputProps) => {
    return (
        <div className="input-area">
            {pastedFiles.length > 0 && (
                <div className="pasted-files-row">
                    {pastedFiles.map(file => (
                        <div key={file.id} className="pasted-file-chip" onClick={() => setPreviewFile(file)}>
                            <FiFileText size={14} />
                            <span>Pasted text · {file.lineCount} lines</span>
                            <button
                                className="pasted-file-remove"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removePastedFile(file.id)
                                }}
                            >
                                <IoClose size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="input-row">
                <textarea
                    ref={textareaRef}
                    onPaste={handlePaste}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSend()
                        }
                    }}
                    placeholder={isHardLimit ? "Start a new chat to continue..." : (repoIngested ? "Analyze code, explain logic, or ask questions..." : "Paste a GitHub URL to analyze repository...")}
                    value={displayValue}
                    onChange={(e) => setInput(e.target.value)}
                    rows={1}
                    disabled={isHardLimit}
                    style={{ opacity: isListening ? 0 : 1 }}
                />
                {isListening && (
                    <div className="voice-overlay-text">
                        {!input && !interimText ? (
                            <span className="listening-dots">
                                <span className="dot">.</span>
                                <span className="dot">.</span>
                                <span className="dot">.</span>
                            </span>
                        ) : (
                            <>
                                <span className="final-text">{input}</span>
                                {interimText && <span className="interim-text"> {interimText}</span>}
                            </>
                        )}
                    </div>
                )}
                <div className="input-actions">
                    <button
                        onClick={handleMicClick}
                        className={isListening ? "mic-active" : ""}
                        data-tooltip={isListening ? "Listening..." : "Voice input"}
                    >
                        <FiMic size={20} />
                    </button>
                    <button
                        onClick={loading ? handleAbort : () => handleSend()}
                        disabled={isHardLimit && !loading}
                        style={{
                            opacity: (loading ? 0.7 : 1),
                            cursor: (loading || isHardLimit) ? 'default' : 'pointer'
                        }}
                    >
                        {loading ? <FiSquare size={16} /> : <FiSend size={18} />}
                    </button>
                </div>
            </div>

            {previewFile && (
                <div className="preview-overlay" onClick={() => setPreviewFile(null)}>
                    <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="preview-modal-header">
                            <span>Pasted text · {previewFile.lineCount} lines</span>
                            <button onClick={() => setPreviewFile(null)}><IoClose size={18} /></button>
                        </div>
                        <pre className="preview-modal-content">{previewFile.content}</pre>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ChatInput