import { useEffect, useState } from 'react'

export function useTheme() {
    const [isDark, setIsDark] = useState(true)

    useEffect(() => {
        const saved = localStorage.getItem("theme")
        setIsDark(saved !== "light")
    }, [])

    const toggleTheme = () => {
        setIsDark(prev => {
            const next = !prev
            localStorage.setItem("theme", next ? "dark" : "light")
            return next
        })
    }

    return { isDark, toggleTheme }
}