import { useEffect, useRef, useState } from 'react'

export function useScrollBehavior(messages: any[]) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesAreaRef = useRef<HTMLDivElement>(null)
    const [showScrollButton, setShowScrollButton] = useState(false)

    // Auto-scroll on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Scroll listener — toggles the scroll-to-bottom button
    useEffect(() => {
        const container = messagesAreaRef.current
        if (!container) return

        const handleScroll = () => {
            const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
            setShowScrollButton(distanceFromBottom > 150)
        }

        container.addEventListener("scroll", handleScroll)
        return () => container.removeEventListener("scroll", handleScroll)
    }, [])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    return { messagesEndRef, messagesAreaRef, showScrollButton, scrollToBottom }
}