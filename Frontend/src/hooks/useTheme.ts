import { useState } from 'react'

export function useTheme() {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem("theme")
        return saved !== "light"
    })

    const toggleTheme = () => {
        setIsDark(prev => {
            const next = !prev
            localStorage.setItem("theme", next ? "dark" : "light")
            return next
        })
    }

    return { isDark, toggleTheme }
}