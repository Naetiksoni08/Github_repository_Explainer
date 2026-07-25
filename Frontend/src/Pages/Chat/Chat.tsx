import { useEffect, useRef, useState } from 'react'
import "./Chat.css"
import { FiCheck, FiEdit, FiSend, FiSquare, FiMic, FiFileText } from "react-icons/fi";
import toast from 'react-hot-toast'
import api from '../../utils/axios';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm';
import Loader from '../../utils/Loader';
import { useNavigate } from 'react-router-dom';
import { FiSidebar, FiDownload } from "react-icons/fi";
import { IoIosSearch } from "react-icons/io";
import CodeBlock from '../../utils/CodeBlock'
import { FiCopy, FiRefreshCw } from "react-icons/fi"
import ThinkingLoader from "../../utils/ThinkerLoader"
import { MdOutlineWbSunny, MdOutlineDarkMode, MdKeyboardArrowDown } from 'react-icons/md';
import { GoPencil } from "react-icons/go";
import { RiDeleteBin5Line } from "react-icons/ri";
import { FaRegStar } from "react-icons/fa6";
import { jsPDF } from 'jspdf';
import { HiEllipsisVertical } from "react-icons/hi2";
import { IoClose } from 'react-icons/io5';
import useClickOutside from '../../utils/useClickOutside';

const Chat = () => {
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [sessions, setSessions] = useState<any[]>([])
    const [sessionId, setSessionId] = useState(crypto.randomUUID())
    const [repoUrl, setRepoUrl] = useState("")
    const [repoIngested, setRepoIngested] = useState(false)
    const [user, setUser] = useState<any>(null);
    const [showSessions, setShowSessions] = useState(true);
    const [loadingSession, setLoadingSession] = useState(false)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("")
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const [isDark, setIsDark] = useState(true) // default dark
    const [showSessionMenu, setShowSessionMenu] = useState(false)
    const [isRenaming, setIsRenaming] = useState(false)
    const [renameValue, setRenameValue] = useState("")
    const [githubRepos, setGithubRepos] = useState<any[]>([])
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const recognitionRef = useRef<any>(null)
    const [interimText, setInterimText] = useState("")
    const [activeMenuSessionId, setActiveMenuSessionId] = useState<string | null>(null);
    const [renameTargetId, setRenameTargetId] = useState<string | null>(null)
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
    const headerMenuRef = useRef<HTMLDivElement>(null)
    const logoutMenuRef = useRef<HTMLDivElement>(null)
    const sessionMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
    const [pastedFiles, setPastedFiles] = useState<PastedFile[]>([])
    const [previewFile, setPreviewFile] = useState<PastedFile | null>(null)

    interface PastedFile {
        id: string
        content: string
        lineCount: number
    }

    const PASTE_LINE_THRESHOLD = 100
    const PASTE_CHAR_THRESHOLD = 6000
    const MAX_TOTAL_PASTE_CHARS = 12000 // combined cap across all pasted files in one message

    const navigate = useNavigate();
    const abortControllerRef = useRef<AbortController | null>(null)

    const handleSessionClick = async (session: any) => {
        if (loadingSession) return
        setLoadingSession(true);
        try {
            await new Promise(res => setTimeout(res, 2000))
            const response = await api.get(`/api/sessions/${session.sessionId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })
            const data = response.data.data;
            setSessionId(data.sessionId);
            setRepoUrl(data.repoUrl?.trim() || "");
            setRepoIngested(true);
            setMessages(data.messages)
            localStorage.setItem("activeSession", session.sessionId);
        } catch (error) {
            toast.error("Failed to Load Session")
        } finally {
            setLoadingSession(false);
        }
    }

    const handleNewChat = () => {
        setSessionId(crypto.randomUUID());
        setRepoUrl("");
        setRepoIngested(false)
        setMessages([]);
    }

    const fetchSession = async () => {
        const response = await api.get('/api/sessions', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        setSessions(response.data.data);
    }
    const Filtersession = sessions.filter(
        session => session.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const starredSessions = sessions.filter(s => s.starred)
    const normalSessions = sessions.filter(s => !s.starred)
    const currentSessionStarred = sessions.find(s => s.sessionId === sessionId)?.starred

    useEffect(() => {
        const init = async () => {
            const storedUser = localStorage.getItem("user");
            const parsedUser = storedUser ? JSON.parse(storedUser) : null;
            if (parsedUser) setUser(parsedUser);

            const savedSession = localStorage.getItem("activeSession")
            if (savedSession) {
                handleSessionClick({ sessionId: savedSession })
            }

            if (parsedUser?.githubId) {
                const res = await api.get('/api/github/repos', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
                setGithubRepos(res.data.data)
            }

            fetchSession();
        }
        init();
    }, [])

    const messagesEndRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (loading) return
        if (!input.trim() && pastedFiles.length === 0) return

        let currentInput = input
        if (pastedFiles.length > 0) {
            const attachmentsText = pastedFiles
                .map(f => `\n\n[Pasted content - ${f.lineCount} lines]\n\`\`\`\n${f.content}\n\`\`\``)
                .join('')
            currentInput = currentInput + attachmentsText
        }

        const userMessage = { role: "user", content: currentInput }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setPastedFiles([])
        setLoading(true)
        localStorage.setItem("activeSession", sessionId);

        try {
            const token = localStorage.getItem("token");

            const isGithubUrl = currentInput.trim().startsWith("https://github.com") || currentInput.trim().includes("github.com/")

            if (!repoIngested && isGithubUrl) {
                // INGEST FLOW
                const trimmedUrl = currentInput.trim()
                setRepoUrl(trimmedUrl)
                await api.post(
                    '/api/ingest',
                    { repoUrl: trimmedUrl, sessionId },
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                setRepoIngested(true)
                const aiMessage = { role: "assistant", content: "Repository analyzed!.", timestamp: new Date().toISOString() }
                setMessages(prev => [...prev, aiMessage])
                toast.success("Repository ready!")
                await fetchSession();
            } else {
                // CHAT FLOW — SSE streaming
                setMessages(prev => [...prev, { role: "assistant", content: "", timestamp: new Date().toISOString() }])
                abortControllerRef.current = new AbortController()
                const response = await fetch("http://localhost:5001/api/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ sessionId, query: currentInput, repoUrl }),
                    signal: abortControllerRef.current.signal
                })

                const reader = response.body!.getReader()
                const decoder = new TextDecoder()

                let streamStarted = false
                let buffer = "" // Incomplete lines ke liye

                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        // { stream: true } — multi-byte characters across chunks handle karega
                        const text = decoder.decode(value, { stream: true })
                        buffer += text
                        const lines = buffer.split("\n")
                        buffer = lines.pop() || "" // Last incomplete line buffer mein rakho

                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                const raw = line.slice(6).trim()
                                if (!raw) continue // Empty chunk skip

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

                                // ========== FIX: Safe JSON parse ==========
                                let chunk: any
                                try {
                                    chunk = JSON.parse(raw)
                                } catch (parseErr) {
                                    console.warn("[SSE] Invalid chunk skipped:", raw.slice(0, 50))
                                    continue // Corrupt chunk skip, stream continue
                                }

                                // Ensure string (agar object aaya toh .content lo, warna String())
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
            await fetchSession();
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
                    // Sirf wahi finals process karo jo pehle count nahi hue
                    if (i >= processedFinalCountRef.current) {
                        newFinalChunk += transcript + " "
                    }
                } else {
                    interimChunk += transcript
                }
            }

            // Update how many finals we've now consumed
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
            processedFinalCountRef.current = 0 // reset counter for fresh session
            recognitionRef.current.start()
            setIsListening(true)
        }
    }

    const handleHome = () => {
        localStorage.removeItem("activeSession");
        setSessionId(crypto.randomUUID());
        setRepoUrl("");
        setRepoIngested(false);
        setMessages([])
        navigate("/home")
    }

    const handleLogout = () => {
        toast.success("Logged out successfully");
        setTimeout(() => {
            localStorage.clear();
            navigate("/auth");
        }, 1000);
    }

    const HandleSearchClick = async () => {
        setShowSearch(true);
        await api.get('/api/search', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
    }
    const displayValue = isListening && interimText
        ? `${input}${input ? " " : ""}${interimText}`
        : input

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    }, [input, interimText])

    useEffect(() => {
        const saved = localStorage.getItem("theme");
        setIsDark(saved !== "light")
    }, [])

    const handleAbort = () => {
        abortControllerRef.current?.abort()
    }
    const handleRename = async () => {
        if (!renameTargetId) return
        await api.patch(`/api/sessions/${renameTargetId}`, { title: renameValue }, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        await fetchSession();
        setIsRenaming(false);
        setRenameTargetId(null);
    }


    const handleStarSession = async (targetId: string) => {
        const target = sessions.find(s => s.sessionId === targetId);
        if (!target?.starred && starredSessions.length >= 3) {
            toast.error("Max 3 starred sessions allowed");
            return;
        }
        await api.patch(`/api/sessions/${targetId}/star`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        setShowSessionMenu(false);
        setActiveMenuSessionId(null);
        await fetchSession();
    }

    const handleDelete = (targetId: string) => {
        setShowSessionMenu(false)
        setActiveMenuSessionId(null)
        setDeleteTargetId(targetId)
        setShowDeleteModal(true)
    }


    const confirmDelete = async () => {
        if (!deleteTargetId) return
        const CurrentIndex = sessions.findIndex(s => s.sessionId === deleteTargetId);
        const nextSession = sessions[CurrentIndex + 1] || sessions[CurrentIndex - 1] || null;
        await api.delete(`/api/sessions/${deleteTargetId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        setShowDeleteModal(false)
        toast.success("Chat deleted")
        await fetchSession();
        // sirf tabhi navigate/reset karo jab active session hi delete hui ho
        if (deleteTargetId === sessionId) {
            if (nextSession) {
                handleSessionClick(nextSession)
            } else {
                handleNewChat();
            }
        }
        setDeleteTargetId(null)
    }

    const ExportPdfHandler = async () => {
        if (messages.length === 0) return
        const sessionTitle = sessions.find(s => s.sessionId === sessionId)?.title || "Chat Export";
        const doc = new jsPDF({ unit: "mm", format: "a4" })

        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 15
        const maxWidth = pageWidth - margin * 2
        let y = 20
        // Title
        doc.setFont("helvetica", "bold")
        doc.setFontSize(18)
        doc.text(sessionTitle, margin, y)
        y += 8

        // Date subtitle
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(120, 120, 120)
        doc.text(`Exported on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`, margin, y)
        y += 10
        // Separator
        doc.setDrawColor(200, 200, 200)
        doc.line(margin, y, pageWidth - margin, y)
        y += 8

        for (const msg of messages) {
            const isUser = msg.role === "user"
            const label = isUser ? "You" : "CodeLens AI"

            // Page overflow check
            if (y + 20 > pageHeight - 15) {
                doc.addPage()
                y = 15
            }

            // Role label
            doc.setFont("helvetica", "bold")
            doc.setFontSize(11)
            doc.setTextColor(isUser ? 80 : 30, isUser ? 80 : 120, isUser ? 80 : 80)
            doc.text(label, margin, y)
            y += 6
            // Clean markdown from content
            const cleaned = (msg.content || "")
                .replace(/```[\s\S]*?```/g, (match: string) => {
                    return match.replace(/```\w*\n?/g, "").replace(/```/g, "").trim()
                })
                .replace(/\*\*(.*?)\*\*/g, "$1")
                .replace(/\*(.*?)\*/g, "$1")
                .replace(/#{1,6}\s/g, "")
                .replace(/`([^`]+)`/g, "$1")

            // Write content with line wrapping
            doc.setFont("helvetica", "normal")
            doc.setFontSize(10)
            doc.setTextColor(50, 50, 50)

            const lines = doc.splitTextToSize(cleaned, maxWidth)
            for (const line of lines) {
                if (y + 6 > pageHeight - 15) {
                    doc.addPage()
                    y = 15
                }
                doc.text(line, margin, y)
                y += 5
            }

            y += 6
            if (y + 4 > pageHeight - 15) {
                doc.addPage()
                y = 15
            }
            doc.setDrawColor(230, 230, 230)
            doc.line(margin, y, pageWidth - margin, y)
            y += 6
        }

        const filename = sessionTitle.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50)
        doc.save(`${filename}.pdf`)
        toast.success("PDF downloaded!")
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

    const renderSessionItem = (session: any) => (
        <div
            key={session.sessionId}
            ref={(el) => { sessionMenuRefs.current[session.sessionId] = el }}
            className={`session-item ${session.sessionId === sessionId ? "active" : ""}`}
            onClick={() => !loadingSession && handleSessionClick(session)}
        >
            <span>{session.title || "Untitled Session"}</span>

            <button
                className="session-item-menu-btn"
                onClick={(e) => {
                    e.stopPropagation()
                    setActiveMenuSessionId(activeMenuSessionId === session.sessionId ? null : session.sessionId)
                }}
            >
                <HiEllipsisVertical size={16} />
            </button>

            {activeMenuSessionId === session.sessionId && (
                <div className="session-menu" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => {
                        setRenameValue(session.title || "");
                        setRenameTargetId(session.sessionId);
                        setIsRenaming(true);
                        setActiveMenuSessionId(null);
                    }}><GoPencil size={14} />Rename</button>

                    <button className="delete-option" onClick={() => handleDelete(session.sessionId)}>
                        <RiDeleteBin5Line size={14} />Delete
                    </button>

                    <button
                        className="starred-option"
                        onClick={() => handleStarSession(session.sessionId)}
                        disabled={!session.starred && starredSessions.length >= 3}
                    >
                        <FaRegStar size={14} />
                        {session.starred ? "Unstar" : "Star"}
                    </button>
                </div>
            )}
        </div>
    )

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
                textareaRef.current?.focus()
            }, 0)
        }
    }

    useClickOutside(headerMenuRef, () => setShowSessionMenu(false), showSessionMenu)
    useClickOutside(logoutMenuRef, () => setShowLogoutModal(false), showLogoutModal)
    return (
        <div className={`chat-wrapper ${isDark ? "dark" : "light"}`}>
            {showSearch && (
                <div className="search-overlay" onClick={() => { setShowSearch(false); setSearchQuery("") }}>
                    <div className="search-modal" onClick={(e) => e.stopPropagation()}>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search sessions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <div className="search-results">
                            {Filtersession.length > 0 ? (
                                Filtersession.map((session: any) => (
                                    <div key={session.sessionId} className="search-result-item"
                                        onClick={() => {
                                            handleSessionClick(session)
                                            setShowSearch(false)
                                            setSearchQuery("")
                                        }}>
                                        <span>{session.title || "Untitled"}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="not-found">No sessions found</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {showDeleteModal && (
                <div className="delete-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                        <p>Are you sure you want to delete this chat?</p>
                        <div className="delete-modal-actions">
                            <button className="delete-modal-cancel" onClick={() => setShowDeleteModal(false)}>No</button>
                            <button className="delete-modal-confirm" onClick={confirmDelete}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
            <div className={`sidebar ${isSidebarCollapsed ? "hidden" : ""}`}>
                <div className="sidebar-header">
                    <div className="nav-logo">
                        <h2 onClick={handleHome} className="text-logo">CodeLens AI</h2>
                        <button className='collapse-sidebar' onClick={() => setIsSidebarCollapsed(true)}>
                            <FiSidebar size={16} />
                        </button>
                    </div>
                    <button className="new-chat-btn" onClick={handleNewChat}>
                        <FiEdit size={16} />
                        <span>New Chat</span>
                    </button>
                    <button className="search-chat-btn" onClick={HandleSearchClick}>
                        <IoIosSearch size={20} />
                        <span>Search</span>
                    </button>
                    <button className='theme-toggle-btn' onClick={() => {
                        const next = !isDark
                        setIsDark(next)
                        localStorage.setItem("theme", next ? "dark" : "light")
                    }}>
                        {isDark ? <MdOutlineWbSunny size={20} /> : <MdOutlineDarkMode size={20} />}
                        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                    </button>

                </div>
                <div className='recent-header'>
                    <span className="recent-title">Recent</span>
                    <button className='hide-btn' onClick={() => setShowSessions(!showSessions)}>
                        {showSessions ? "Hide" : "Show"}
                    </button>
                </div>
                {showSessions && (
                    <div className="sessions-list">
                        {starredSessions.length > 0 && (
                            <>
                                {starredSessions.map(renderSessionItem)}
                                <div className="sessions-divider" />
                            </>
                        )}
                        {normalSessions.map(renderSessionItem)}
                    </div>
                )}

                <div className='user-profile-wrapper' ref={logoutMenuRef}>
                    <div className='user-profile' onClick={(e) => {
                        e.stopPropagation();
                        setShowLogoutModal(!showLogoutModal)
                    }}>
                        <div className="avatar">
                            <img
                                src={user?.picture || "/avatar.svg"}
                                alt="profile"
                                className="avatar-img"
                                referrerPolicy="no-referrer"
                                onError={(e) => { (e.target as HTMLImageElement).src = "/avatar.svg" }}
                            />
                        </div>
                        <span className='username'>{user?.name || "User"}</span>
                    </div>

                    {showLogoutModal && (
                        <div className="logout-modal">
                            <button onClick={handleLogout} className="logout-btn">Logout</button>
                        </div>
                    )}
                </div>
            </div>
            <div className={`chat-main ${messages.length === 0 && githubRepos.length === 0 && !loadingSession ? 'empty-chat' : ''}`}>
                <div className='chat-header'>
                    {isSidebarCollapsed && (
                        <button className="floating-toggle" onClick={() => setIsSidebarCollapsed(false)}>
                            <FiSidebar size={20} />
                        </button>
                    )}
                    {messages.length > 0 && (
                        <span className='chat-title' onClick={() => setShowSessionMenu(!showSessionMenu)}>
                            {sessions.find(s => s.sessionId === sessionId)?.title || "New Chat"}
                            <MdKeyboardArrowDown size={20} />
                        </span>

                    )}

                    {showSessionMenu && (
                        <div className='session-menu' ref={headerMenuRef}>
                            <button onClick={() => {
                                setRenameValue(sessions.find(s => s.sessionId === sessionId)?.title || "");
                                setRenameTargetId(sessionId);
                                setIsRenaming(true);
                                setShowSessionMenu(false);
                            }}><GoPencil size={14} />Rename</button>

                            <button className="delete-option" onClick={() => handleDelete(sessionId)}>
                                <RiDeleteBin5Line size={14} />Delete
                            </button>

                            <button
                                className="starred-option"
                                onClick={() => handleStarSession(sessionId)}
                                disabled={!currentSessionStarred && starredSessions.length >= 3}
                            >
                                <FaRegStar size={14} />
                                {currentSessionStarred ? "Unstar" : "Star"}
                            </button>
                        </div>
                    )}
                    {isRenaming && (
                        <div className="rename-overlay" onClick={() => setIsRenaming(false)}>
                            <div className="rename-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="rename-modal-header">
                                    <span>Edit name</span>
                                    <button className="rename-modal-close" onClick={() => setIsRenaming(false)}>
                                        <IoClose size={18} />
                                    </button>
                                </div>
                                <input
                                    autoFocus
                                    className="rename-modal-input"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleRename()
                                        if (e.key === "Escape") setIsRenaming(false)
                                    }}
                                />
                                <div className="rename-modal-actions">
                                    <button className="rename-modal-cancel" onClick={() => setIsRenaming(false)}>Cancel</button>
                                    <button className="rename-modal-confirm" onClick={handleRename}>Confirm</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {messages.length > 0 && (
                        <button className="export-pdf-btn" onClick={() => ExportPdfHandler()}>
                            <FiDownload size={20} />
                            Export PDF
                        </button>
                    )}
                </div>
                <div className="messages-area">
                    {loadingSession ? (
                        <Loader />
                    ) : messages.length === 0 ? (
                        githubRepos.length > 0 ? (
                            <div className="repo-picker">
                                <h2>Hey {user?.name?.split(" ")[0]}, which repo to analyze?</h2>
                                <div className="repo-grid">
                                    {githubRepos.map((repo: any) => (
                                        <div className="repo-card" key={repo.id} onClick={() => setInput(repo.html_url)}>
                                            <span className="repo-name">{repo.name}</span>
                                            <span className="repo-desc">{repo.description || "No description"}</span>
                                            <div className="repo-meta">
                                                {repo.language && <span className="repo-lang">{repo.language}</span>}
                                                <span className="repo-stars">⭐ {repo.stargazers_count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <h2>Hey {user?.name?.split(" ")[0]}, 👋</h2>
                                <h2>What Repository would you like to analyze?</h2>
                            </div>
                        )
                    ) : (
                        messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.role}`}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        code({ className, children }) {
                                            return (
                                                <CodeBlock className={className}>
                                                    {children}
                                                </CodeBlock>
                                            )
                                        },
                                        a({ href, children }) {
                                            return (
                                                <a
                                                    href={href}
                                                    target='_blank'
                                                    rel="noopener noreferrer"
                                                    className='markdown-link'
                                                >
                                                    {children}
                                                </a>
                                            )
                                        }
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>

                                {msg.interrupted && (
                                    <span className="interrupted-text">AI's response was interrupted</span>
                                )}

                                {msg.errored && (
                                    <div className="error-retry-row">
                                        <span className="interrupted-text">Something went wrong generating this response.</span>
                                        <button
                                            className="retry-error-btn"
                                            onClick={() => {
                                                const prevUserMsg = messages[index - 1]
                                                if (prevUserMsg?.role === "user") {
                                                    setInput(prevUserMsg.content)
                                                    setMessages(prev => prev.slice(0, index - 1))
                                                    setTimeout(() => textareaRef.current?.focus(), 0)
                                                }
                                            }}
                                        >
                                            <FiRefreshCw size={13} /> Retry
                                        </button>
                                    </div>
                                )}

                                {msg.role === "user" && (
                                    <div className="message-actions">
                                        <button data-tooltip="Copy" onClick={() => {
                                            navigator.clipboard.writeText(msg.content)
                                            setCopiedIndex(index)
                                            setTimeout(() => setCopiedIndex(null), 2000)
                                        }}>
                                            {copiedIndex === index ? <FiCheck size={14} /> : <FiCopy size={14} />}
                                            <span>Copy</span>
                                        </button>

                                        <button data-tooltip="Edit" onClick={() => {
                                            setInput(msg.content)
                                            setTimeout(() => textareaRef.current?.focus(), 0)
                                        }}>
                                            <FiEdit size={14} />
                                            <span>Edit</span>
                                        </button>

                                        <button data-tooltip="Retry" onClick={() => {
                                            setInput(msg.content)
                                            setMessages(prev => prev.slice(0, index))
                                        }}>
                                            <FiRefreshCw size={14} />
                                            <span>Retry</span>
                                        </button>
                                    </div>
                                )}

                                {msg.role === "assistant" && msg.content && (
                                    <div className="message-footer">
                                        {msg.timestamp && (
                                            <span className="message-time">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                        <button className="footer-copy-btn" data-tooltip="Copy" onClick={() => {
                                            navigator.clipboard.writeText(msg.content)
                                            setCopiedIndex(index)
                                            setTimeout(() => setCopiedIndex(null), 2000)
                                        }}>
                                            {copiedIndex === index ? <FiCheck size={15} /> : <FiCopy size={15} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="message assistant">
                            <ThinkingLoader />
                        </div>
                    )}
                    <div ref={messagesEndRef}></div>
                </div>
                {!loadingSession && (
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
                                                setPastedFiles(prev => prev.filter(f => f.id !== file.id))
                                            }}
                                        >
                                            <IoClose size={12} />
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
                                placeholder={repoIngested ? "Analyze code, explain logic, or ask questions..." : "Paste a GitHub URL to analyze repository..."}
                                value={displayValue}
                                onChange={(e) => setInput(e.target.value)}
                                rows={1}
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
                                    onClick={loading ? handleAbort : handleSend}
                                    style={{
                                        opacity: loading ? 0.7 : 1,
                                        cursor: loading ? 'default' : 'pointer'
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
                )}

            </div>
        </div>
    )
}


export default Chat