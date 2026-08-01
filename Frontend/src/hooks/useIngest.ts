// src/hooks/useIngest.ts
import { useState } from 'react'
import toast from 'react-hot-toast'

interface IngestProgress {
    stage: string
    percent: number
}

export function useIngest(sessionId: string) {
    const [ingestProgress, setIngestProgress] = useState<IngestProgress | null>(null)

    const handleIngestWithProgress = async (trimmedUrl: string): Promise<boolean> => {
        setIngestProgress({ stage: "starting", percent: 0 })
        const token = localStorage.getItem("token")

        try {
            const response = await fetch("http://localhost:5001/api/ingest", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ repoUrl: trimmedUrl, sessionId })
            })

            if (!response.ok) {
                if (response.status === 429) {
                    const data = await response.json().catch(() => null)
                    toast.error(data?.message || "Too many ingest requests. Please wait before trying again.")
                } else {
                    toast.error("Something went wrong while analyzing repository")
                }
                setIngestProgress(null)
                return false
            }

            if (!response.body) {
                throw new Error("No response body")
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const text = decoder.decode(value)
                const lines = text.split("\n")

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const raw = line.slice(6)
                        if (!raw.trim()) continue

                        const parsed = JSON.parse(raw)

                        if (parsed.error) {
                            toast.error(parsed.message || "Ingest failed")
                            setIngestProgress(null)
                            return false
                        }

                        if (parsed.done) {
                            setIngestProgress(null)
                            return true
                        }

                        setIngestProgress({ stage: parsed.stage, percent: parsed.percent })
                    }
                }
            }

            setIngestProgress(null)
            return true
        } catch (err) {
            console.error("Ingest stream error:", err)
            toast.error("Something went wrong while analyzing repository")
            setIngestProgress(null)
            return false
        }
    }

    return { ingestProgress, handleIngestWithProgress }
}