import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/axios'
import type { NavigateFunction } from 'react-router-dom'

interface UseSessionsParams {
    onSessionLoaded: (messages: any[]) => void
    setMessages: React.Dispatch<React.SetStateAction<any[]>>
    onNewChat: () => void
    resetWarning: () => void
    navigate: NavigateFunction
}

export function useSessions({ setMessages, onSessionLoaded, onNewChat, resetWarning, navigate }: UseSessionsParams) {
    const [sessions, setSessions] = useState<any[]>([])
    const [sessionId, setSessionId] = useState(crypto.randomUUID())
    const [repoUrl, setRepoUrl] = useState("")
    const [repoIngested, setRepoIngested] = useState(false)
    const [loadingSession, setLoadingSession] = useState(false)
    const [showSessions, setShowSessions] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showSearch, setShowSearch] = useState(false)
    const [activeMenuSessionId, setActiveMenuSessionId] = useState<string | null>(null)
    const [renameTargetId, setRenameTargetId] = useState<string | null>(null)
    const [renameValue, setRenameValue] = useState("")
    const [isRenaming, setIsRenaming] = useState(false)
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const sessionMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

    const Filtersession = sessions.filter(
        session => session.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const starredSessions = sessions.filter(s => s.starred)
    const normalSessions = sessions.filter(s => !s.starred)
    const currentSessionStarred = sessions.find(s => s.sessionId === sessionId)?.starred

    const fetchSession = async () => {
        const response = await api.get('/api/sessions', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        setSessions(response.data.data)
    }

    const handleSessionClick = async (session: any) => {
        if (loadingSession) return
        setLoadingSession(true)
        try {
            await new Promise(res => setTimeout(res, 2000))
            const response = await api.get(`/api/sessions/${session.sessionId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })
            const data = response.data.data
            setSessionId(data.sessionId)
            setRepoUrl(data.repoUrl?.trim() || "")
            setRepoIngested(true)
            onSessionLoaded(data.messages)
            resetWarning()
            localStorage.setItem("activeSession", session.sessionId)
        } catch (error) {
            toast.error("Failed to Load Session")
        } finally {
            setLoadingSession(false)
        }
    }

    const handleNewChat = () => {
        setSessionId(crypto.randomUUID())
        setRepoUrl("")
        setRepoIngested(false)
        onNewChat()
        resetWarning()
    }

    const handleHome = () => {
        localStorage.removeItem("activeSession")
        setSessionId(crypto.randomUUID())
        setRepoUrl("")
        setRepoIngested(false)
        onNewChat()
        navigate("/home")
    }

    const HandleSearchClick = async () => {
        setShowSearch(true)
        await api.get('/api/search', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
    }

    const handleRename = async () => {
        if (!renameTargetId) return
        await api.patch(`/api/sessions/${renameTargetId}`, { title: renameValue }, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        await fetchSession()
        setIsRenaming(false)
        setRenameTargetId(null)
    }

    const handleStarSession = async (targetId: string) => {
        const target = sessions.find(s => s.sessionId === targetId)
        if (!target?.starred && starredSessions.length >= 3) {
            toast.error("Max 3 starred sessions allowed")
            return
        }
        const wasStarred = target?.starred
        await api.patch(`/api/sessions/${targetId}/star`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        setActiveMenuSessionId(null)
        await fetchSession()
        toast.success(wasStarred ? "Session unstarred" : "Session starred!")
    }

    const handleDelete = (targetId: string) => {
        setActiveMenuSessionId(null)
        setDeleteTargetId(targetId)
        setShowDeleteModal(true)
    }

    const confirmDelete = async () => {
        if (!deleteTargetId) return
        const currentIndex = sessions.findIndex(s => s.sessionId === deleteTargetId)
        const nextSession = sessions[currentIndex + 1] || sessions[currentIndex - 1] || null

        await api.delete(`/api/sessions/${deleteTargetId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        setShowDeleteModal(false)
        toast.success("Chat deleted")
        await fetchSession()

        if (deleteTargetId === sessionId) {
            if (nextSession) {
                handleSessionClick(nextSession)
            } else {
                handleNewChat()
            }
        }
        setDeleteTargetId(null)
    }

    useEffect(() => {
        if (!activeMenuSessionId) return

        const handleClick = (e: MouseEvent) => {
            const currentRef = sessionMenuRefs.current[activeMenuSessionId]
            if (currentRef && !currentRef.contains(e.target as Node)) {
                setActiveMenuSessionId(null)
            }
        }

        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [activeMenuSessionId])

    return {
        setMessages, sessions, sessionId, setSessionId, repoUrl, setRepoUrl, repoIngested, setRepoIngested,
        loadingSession, showSessions, setShowSessions, searchQuery, setSearchQuery,
        showSearch, setShowSearch, activeMenuSessionId, setActiveMenuSessionId,
        renameTargetId, setRenameTargetId, renameValue, setRenameValue,
        isRenaming, setIsRenaming, deleteTargetId, showDeleteModal, setShowDeleteModal,
        sessionMenuRefs, Filtersession, starredSessions, normalSessions, currentSessionStarred,
        fetchSession, handleSessionClick, handleNewChat, handleHome, HandleSearchClick,
        handleRename, handleStarSession, handleDelete, confirmDelete
    }
}