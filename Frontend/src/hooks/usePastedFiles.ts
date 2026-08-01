import { useRef, useState } from 'react'
import toast from 'react-hot-toast'

interface PastedFile {
    id: string
    content: string
    lineCount: number
}

const PASTE_LINE_THRESHOLD = 100
const PASTE_CHAR_THRESHOLD = 6000
const MAX_TOTAL_PASTE_CHARS = 12000

export function usePastedFiles(onFocusTextarea: () => void) {
    const [pastedFiles, setPastedFiles] = useState<PastedFile[]>([])
    const [previewFile, setPreviewFile] = useState<PastedFile | null>(null)

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedText = e.clipboardData.getData('text')
        if (!pastedText) return

        const lineCount = pastedText.split('\n').length

        if (lineCount > PASTE_LINE_THRESHOLD || pastedText.length > PASTE_CHAR_THRESHOLD) {
            e.preventDefault()

            const currentTotal = pastedFiles.reduce((sum, f) => sum + f.content.length, 0)

            if (currentTotal + pastedText.length > MAX_TOTAL_PASTE_CHARS) {
                toast.error(
                    `Total pasted content limit reached (${MAX_TOTAL_PASTE_CHARS.toLocaleString()} chars). Remove a pasted file before adding more.`
                )
                return
            }

            const newFile: PastedFile = {
                id: crypto.randomUUID(),
                content: pastedText,
                lineCount
            }
            setPastedFiles(prev => [...prev, newFile])
            setTimeout(() => {
                onFocusTextarea()
            }, 0)
        }
    }

    const removePastedFile = (id: string) => {
        setPastedFiles(prev => prev.filter(f => f.id !== id))
    }

    const buildAttachmentsText = () => {
        return pastedFiles
            .map(f => `\n\n[Pasted content - ${f.lineCount} lines]\n\`\`\`\n${f.content}\n\`\`\``)
            .join('')
    }

    const clearPastedFiles = () => setPastedFiles([])

    return {
        pastedFiles,
        previewFile,
        setPreviewFile,
        handlePaste,
        removePastedFile,
        buildAttachmentsText,
        clearPastedFiles
    }
}