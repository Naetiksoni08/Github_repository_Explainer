import { useEffect, useRef, useState } from 'react'
import "./Chat.css"
import { FiCheck, FiEdit, FiSend, FiSquare } from "react-icons/fi";
import toast from 'react-hot-toast'
import api from '../../utils/axios';
import ReactMarkdown from 'react-markdown'
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
        if (!input.trim()) return
        const userMessage = { role: "user", content: input }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setLoading(true)
        localStorage.setItem("activeSession", sessionId);

        await new Promise(res => setTimeout(res, 50))

        try {
            const token = localStorage.getItem("token");

            const isGithubUrl = input.trim().startsWith("https://github.com") || input.trim().includes("github.com/")

            if (!repoIngested && isGithubUrl) {
                // INGEST FLOW
                const trimmedUrl = input.trim()
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
                setTimeout(() => {
                    setMessages(prev => prev.filter(msg => msg.content !== aiMessage.content))
                }, 8000)
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
                    body: JSON.stringify({ sessionId, query: input, repoUrl }),
                    signal: abortControllerRef.current.signal
                })

                const reader = response.body!.getReader()
                const decoder = new TextDecoder()

                let streamStarted = false
                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        const text = decoder.decode(value)
                        const lines = text.split("\n")

                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                const raw = line.slice(6);
                                if (raw === "[DONE]") break
                                if (raw === "[ERROR]") throw new Error("Stream error from server")
                                const chunk = JSON.parse(raw);
                                if (!streamStarted) {
                                    setLoading(false)
                                    streamStarted = true
                                }
                                setMessages(prev => {
                                    const updated = [...prev]
                                    updated[updated.length - 1] = {
                                        ...updated[updated.length - 1],
                                        content: updated[updated.length - 1].content + chunk
                                    }
                                    return updated
                                })
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


    const textareaRef = useRef<HTMLTextAreaElement>(null)
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [input])

    useEffect(() => {
        const saved = localStorage.getItem("theme");
        setIsDark(saved !== "light")
    }, [])

    const handleAbort = () => {
        abortControllerRef.current?.abort()
    }

    const handleRename = async () => {
        await api.patch(`/api/sessions/${sessionId}`, { title: renameValue }, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        await fetchSession();
        setIsRenaming(false);
        setShowSessionMenu(false);
    }
    const handleStarSession = async () => {
        const isCurrentlyStarred = sessions.find(s => s.sessionId === sessionId)?.starred;
        if (!isCurrentlyStarred && starredSessions.length >= 3) {
            toast.error("Max 3 starred sessions allowed");
            return;
        }
        await api.patch(`/api/sessions/${sessionId}/star`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        setShowSessionMenu(false);
        await fetchSession();
    }


    const handleDelete = () => {
        setShowSessionMenu(false)
        setShowDeleteModal(true)
    }

    const confirmDelete = async () => {
        const CurrentIndex = sessions.findIndex(s => s.sessionId === sessionId);
        const nextSession = sessions[CurrentIndex + 1] || sessions[CurrentIndex - 1] || null;
        await api.delete(`/api/sessions/${sessionId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        setShowDeleteModal(false)
        toast.success("Chat deleted")
        await fetchSession();
        if (nextSession) {
            handleSessionClick(nextSession)
        } else {
            handleNewChat();
        }
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
            <div className={`sidebar ${isSidebarCollapsed ? "hidden" : ""}`}
                onClick={() => setShowLogoutModal(false)}>
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
                                <div className="sessions-section-label">Starred ({starredSessions.length}/3)</div>
                                {starredSessions.map((session: any) => (
                                    <div
                                        key={session.sessionId}
                                        className={`session-item ${session.sessionId === sessionId ? "active" : ""}`}
                                        onClick={() => !loadingSession && handleSessionClick(session)}
                                    >
                                        <span>{session.title || "Untitled Session"}</span>
                                    </div>
                                ))}
                                <div className="sessions-divider" />
                            </>
                        )}
                        {normalSessions.map((session: any) => (
                            <div
                                key={session.sessionId}
                                className={`session-item ${session.sessionId === sessionId ? "active" : ""}`}
                                onClick={() => !loadingSession && handleSessionClick(session)}
                            >
                                <span>{session.title || "Untitled Session"}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className='sidebar-footer'>


                    <div className='user-profile' onClick={(e) => { e.stopPropagation(); setShowLogoutModal(!showLogoutModal) }}>

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
                        <div className='session-menu'>
                            {isRenaming ? (
                                <div className="rename-input-row">
                                    <input
                                        autoFocus
                                        value={renameValue}
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key == "Enter") handleRename()
                                            if (e.key == "Escape") setIsRenaming(false)
                                        }}
                                    />
                                    <button onClick={handleRename}>Save</button>
                                </div>
                            ) : (
                                <>
                                    <button onClick={() => {
                                        setRenameValue(sessions.find(s => s.sessionId === sessionId)?.title || "");
                                        setIsRenaming(true);
                                    }}><GoPencil size={14} />Rename</button>
                                    <button className="delete-option" onClick={handleDelete}><RiDeleteBin5Line size={14} />Delete</button>
                                    <button
                                        className="starred-option"
                                        onClick={handleStarSession}
                                        disabled={!currentSessionStarred && starredSessions.length >= 3}
                                    >
                                        <FaRegStar size={14} />
                                        {currentSessionStarred ? "Unstar" : "Star"}
                                    </button>
                                </>
                            )}
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
                                <h2>What repo would you like to analyze?</h2>
                            </div>
                        )
                    ) : (
                        messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.role}`}>
                                <ReactMarkdown
                                    components={{
                                        code({ className, children }) {
                                            return (
                                                <CodeBlock className={className}>
                                                    {children}
                                                </CodeBlock>
                                            )
                                        }
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>

                                {msg.interrupted && (
                                    <span className="interrupted-text">User interrupted the response</span>
                                )}

                                {msg.role === "user" && (
                                    <div className="message-actions">
                                        <button data-tooltip="Copy" onClick={() => {
                                            navigator.clipboard.writeText(msg.content)
                                            setCopiedIndex(index)
                                            setTimeout(() =>
                                                setCopiedIndex(null), 2000)
                                        }}>
                                            {copiedIndex === index ? <FiCheck size={13} /> : <FiCopy size={13} />}
                                        </button>
                                        <button data-tooltip="Edit" onClick={() => {
                                            setInput(msg.content)
                                            setTimeout(() => textareaRef.current?.focus(), 0)
                                        }}>
                                            <FiEdit size={13} />
                                        </button>
                                        <button data-tooltip="Retry" onClick={() => {
                                            setInput(msg.content)
                                            setMessages(prev => prev.slice(0, index))
                                        }}>
                                            <FiRefreshCw size={13} />
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
                        <textarea
                            ref={textareaRef}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }

                            }}
                            placeholder={repoIngested ? "Ask anything about the repo..." : "Paste GitHub URL to get started..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            rows={1}
                        />
                        <button onClick={loading ? handleAbort : handleSend}>
                            {loading ? <FiSquare size={16} /> : <FiSend size={16} />}
                        </button>
                    </div>
                )}
            </div>
        </div >
    )
}


export default Chat