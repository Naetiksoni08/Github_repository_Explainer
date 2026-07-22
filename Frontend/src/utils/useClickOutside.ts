import { useEffect, type RefObject } from "react"

function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T | null>,
    onOutsideClick: () => void,
    active: boolean = true
) {
    useEffect(() => {
        if (!active) return

        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onOutsideClick()
            }
        }

        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [ref, onOutsideClick, active])
}

export default useClickOutside