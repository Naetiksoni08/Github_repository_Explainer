import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/axios'

interface UseChatMessagesParams {
    messages: any[]
    setMessages: React.Dispatch<React.SetStateAction<any[]>>
    sessionId: string
    repoUrl: string
    repoIngested: boolean
    setRepoIngested: (val: boolean) => void
    setRepoUrl: (val: string) => void
    fetchSession: () => Promise<void>
    handleIngestWithProgress: (url: string) => Promise<boolean>
    pastedFiles: any[]
    buildAttachmentsText: () => string
    clearPastedFiles: () => void
    focusTextarea: () => void
    hardLimit: number
}

export function useChatMessages({messages,setMessages,
    sessionId, repoUrl, repoIngested, setRepoIngested, setRepoUrl,
    fetchSession, handleIngestWithProgress, pastedFiles, buildAttachmentsText,
    clearPastedFiles, focusTextarea, hardLimit
}: UseChatMessagesParams) {
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editValue, setEditValue] = useState("")
    const abortControllerRef = useRef<AbortController | null>(null)

    const handleSend = async (overrideText?: string) => {
        if (loading) return
        if (messages.length >= hardLimit) {
            toast.error("This conversation has reached its limit. Please start a new chat.")
            return
        }
        const textToSend = overrideText ?? input
        if (!textToSend.trim() && pastedFiles.length === 0) return

        let currentInput = textToSend
        if (pastedFiles.length > 0) {
            currentInput = currentInput + buildAttachmentsText()
        }

        const userMessage = { role: "user", content: currentInput, timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        clearPastedFiles()
        setLoading(true)
        localStorage.setItem("activeSession", sessionId)

        try {
            const token = localStorage.getItem("token")

            const currentInputTrimmed = currentInput.trim()
            const isGithubUrl = currentInputTrimmed.startsWith("https://github.com") || currentInputTrimmed.includes("github.com/")

            const OTHER_REPO_HOSTS = ["gitlab.com", "bitbucket.org", "sourceforge.net", "codeberg.org"]
            const isOtherRepoHost = OTHER_REPO_HOSTS.some((host) => currentInputTrimmed.includes(host))

            if (!repoIngested && isOtherRepoHost && !isGithubUrl) {
                toast.error("Currently only GitHub repositories are supported. Please paste a GitHub repo URL.")
                setLoading(false)
                return
            }
            if (!repoIngested && isGithubUrl) {
                const trimmedUrl = currentInput.trim()
                setRepoUrl(trimmedUrl)

                const success = await handleIngestWithProgress(trimmedUrl)

                if (success) {
                    setRepoIngested(true)
                    const aiMessage = { role: "assistant", content: "Repository analyzed!.", timestamp: new Date().toISOString() }
                    setMessages(prev => [...prev, aiMessage])
                    toast.success("Repository ready!")
                    await fetchSession()
                }
            } else {
                setMessages(prev => [...prev, { role: "assistant", content: "", timestamp: new Date().toISOString() }])
                abortControllerRef.current = new AbortController()
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ sessionId, query: currentInput, repoUrl }),
                    signal: abortControllerRef.current.signal
                })

                if (!response.ok) {
                    if (response.status === 429) {
                        const data = await response.json().catch(() => null)
                        toast.error(data?.message || "Too many requests. Please wait a few minutes and try again.")
                    } else {
                        toast.error("Something went wrong. Please try again.")
                    }
                    setMessages(prev => prev.slice(0, -1))
                    setLoading(false)
                    return
                }

                const reader = response.body!.getReader()
                const decoder = new TextDecoder()

                let streamStarted = false
                let buffer = ""

                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        const text = decoder.decode(value, { stream: true })
                        buffer += text
                        const lines = buffer.split("\n")
                        buffer = lines.pop() || ""

                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                const raw = line.slice(6).trim()
                                if (!raw) continue

                                if (raw === "[DONE]") {
                                    buffer = ""
                                    break
                                }

                                if (raw === "[ERROR]") {
                                    console.error("[SSE] Server reported stream error")
                                    setMessages(prev => {
                                        const updated = [...prev]
                                        const last = updated[updated.length - 1]
                                        if (last?.role === "assistant") {
                                            updated[updated.length - 1] = { ...last, errored: true }
                                        }
                                        return updated
                                    })
                                    continue
                                }

                                let chunk: any
                                try {
                                    chunk = JSON.parse(raw)
                                } catch (parseErr) {
                                    console.warn("[SSE] Invalid chunk skipped:", raw.slice(0, 50))
                                    continue
                                }

                                const contentChunk = typeof chunk === "string"
                                    ? chunk
                                    : (chunk?.content ? String(chunk.content) : "")

                                if (!streamStarted) {
                                    setLoading(false)
                                    streamStarted = true
                                }

                                if (contentChunk) {
                                    setMessages(prev => {
                                        const updated = [...prev]
                                        updated[updated.length - 1] = {
                                            ...updated[updated.length - 1],
                                            content: updated[updated.length - 1].content + contentChunk
                                        }
                                        return updated
                                    })
                                }
                            }
                        }
                    }
                } catch (err: any) {
                    if (err.name === "AbortError") {
                        setMessages(prev => {
                            const updated = [...prev]
                            const last = updated[updated.length - 1]
                            if (last?.role === "assistant") {
                                updated[updated.length - 1] = { ...last, interrupted: true }
                            }
                            return updated
                        })
                        setLoading(false)
                        return
                    }
                    throw err
                }
            }
            await fetchSession()
        } catch (error: any) {
            if (error?.name === "AbortError") {
                setMessages(prev => {
                    const updated = [...prev]
                    const last = updated[updated.length - 1]
                    if (last?.role === "assistant") {
                        updated[updated.length - 1] = { ...last, interrupted: true }
                    }
                    return updated
                })
                return
            }
            toast.error(error?.response?.data?.message || "Something Went Wrong")
            setMessages(prev => {
                const last = prev[prev.length - 1]
                if (last?.role === "assistant" && !last.content) {
                    return prev.slice(0, -1)
                }
                return prev
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRetry = async (index: number) => {
        const target = messages[index]
        try {
            await api.patch(`/api/sessions/${sessionId}/truncate`,
                { fromTimestamp: target.timestamp },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            )
            setMessages(prev => prev.slice(0, index))
            setInput(target.content)
            setTimeout(() => focusTextarea(), 0)
        } catch (err) {
            toast.error("Couldn't retry, please try again")
            throw err
        }
    }

    const handleAbort = async () => {
        abortControllerRef.current?.abort()
        const lastMsg = messages[messages.length - 1]
        if (lastMsg?.role === "assistant") {
            try {
                await api.patch(`/api/sessions/${sessionId}/mark-interrupted`,
                    { timestamp: lastMsg.timestamp, content: lastMsg.content },
                    { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                )
            } catch { /* ignore */ }
        }
    }

    return { input, setInput, loading, editingIndex, setEditingIndex, editValue, setEditValue, handleSend, handleRetry, handleAbort }
}