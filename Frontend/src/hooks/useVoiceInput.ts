// src/hooks/useVoiceInput.ts
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

export function useVoiceInput(input: string, setInput: (val: string) => void) {
    const [isListening, setIsListening] = useState(false)
    const [interimText, setInterimText] = useState("")
    const recognitionRef = useRef<any>(null)
    const baseTextRef = useRef("")
    const processedFinalCountRef = useRef(0)

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SpeechRecognition) return

        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "en-US"

        recognition.onresult = (event: any) => {
            let newFinalChunk = ""
            let interimChunk = ""

            for (let i = 0; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    if (i >= processedFinalCountRef.current) {
                        newFinalChunk += transcript + " "
                    }
                } else {
                    interimChunk += transcript
                }
            }

            let finalCount = 0
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) finalCount++
            }
            processedFinalCountRef.current = finalCount

            if (newFinalChunk) {
                baseTextRef.current = baseTextRef.current
                    ? `${baseTextRef.current} ${newFinalChunk.trim()}`
                    : newFinalChunk.trim()
                setInput(baseTextRef.current)
            }
            setInterimText(interimChunk)
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognition.onerror = () => {
            setIsListening(false)
            toast.error("Couldn't hear that, try again")
        }

        recognitionRef.current = recognition
    }, [])

    const handleMicClick = () => {
        if (!recognitionRef.current) {
            toast.error("Voice input not supported in this browser")
            return
        }
        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
            setInterimText("")
        } else {
            baseTextRef.current = input
            processedFinalCountRef.current = 0
            recognitionRef.current.start()
            setIsListening(true)
        }
    }

    const displayValue = isListening && interimText
        ? `${input}${input ? " " : ""}${interimText}`
        : input

    return { isListening, interimText, handleMicClick, displayValue }
}