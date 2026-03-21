import { useEffect, useRef, useState } from 'react'
import "./Chat.css"
import { FiEdit } from "react-icons/fi";
import toast from 'react-hot-toast'
import api from '../../utils/axios';
import ReactMarkdown from 'react-markdown'
import Loader from '../../utils/Loader';
import { useNavigate } from 'react-router-dom';
import { FiSidebar } from "react-icons/fi";
import { IoIosSearch } from "react-icons/io";
import CodeBlock from '../../utils/CodeBlock'
import { FiCopy, FiRefreshCw } from "react-icons/fi"
import ThinkingLoader from "../../utils/ThinkerLoader"

const Chat = () => {
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [sessions, setSessions] = useState<any[]>([])
    const [sessionId, setSessionId] = useState("")
    const [repoUrl, setRepoUrl] = useState("")
    const [repoIngested, setRepoIngested] = useState(false)
    const [user, setUser] = useState<any>(null);
    const [showSessions, setShowSessions] = useState(true);
    const [loadingSession, setLoadingSession] = useState(false)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("")

    const navigate = useNavigate();

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
            setRepoUrl(data.repoUrl);
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

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
        const savedSession = localStorage.getItem("activeSession")
        if (savedSession) {
            handleSessionClick({ sessionId: savedSession })
        }
        fetchSession();
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

        await new Promise(res => setTimeout(res, 50))

        try {
            if (!repoIngested) {
                const response = await api.post(
                    '/api/ingest',
                    { repoUrl: input },
                    { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                )
                if (response.status) {
                    setRepoUrl(input)
                    setRepoIngested(true)
                    const aiMessage = { role: "assistant", content: "Repository analyzed! Ask me anything about the codebase." }
                    setMessages(prev => [...prev, aiMessage])
                    toast.success("Repository ready!")
                    setTimeout(() => {
                        setMessages(prev => prev.filter(msg => msg.content !== aiMessage.content))
                    }, 8000);
                }
            } else {
                const response = await api.post(
                    '/api/chat',
                    { sessionId, query: input, repoUrl },
                    { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                )
                const data = await response.data;
                const Aimessage = { role: "assistant", content: data.data.result };
                setMessages(prev => [...prev, Aimessage]);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Something Went Wrong")
        } finally {
            setLoading(false);
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
        localStorage.clear();
        navigate("/auth")
        toast.success("Logged out successfully");
    }

    const HandleSearchClick = async () => {
        setShowSearch(true);
        const response = await api.get('/api/search', {
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



    return (

        <div className="chat-wrapper">
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

                </div>
                <div className='recent-header'>
                    <span className="recent-title">Recent</span>
                    <button className='hide-btn' onClick={() => setShowSessions(!showSessions)}>
                        {showSessions ? "Hide" : "Show"}
                    </button>
                </div>
                {showSessions && (
                    <div className="sessions-list">
                        {sessions.map((session: any) => (
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
                            {user?.picture ? (
                                <img src={user.picture} alt="profile" className="avatar-img" />
                            ) : (
                                user?.name?.charAt(0) || "U"
                            )}

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
            {isSidebarCollapsed && (
                <button className="floating-toggle" onClick={() => setIsSidebarCollapsed(false)}>
                    <FiSidebar size={20} />
                </button>
            )}

            <div className="chat-main">
                <div className="messages-area">
                    {loadingSession ? (
                        <Loader />
                    ) : messages.length === 0 ? (
                        <div className="empty-state">
                            <h2>Hey {user?.name?.split(" ")[0]}, 👋</h2>
                            <h2>What repo would you like to analyze?</h2>
                            <p>Paste a GitHub URL below to get started</p>
                        </div>
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

                                {msg.role === "user" && (
                                    <div className="message-actions">
                                        <button data-tooltip="Copy" onClick={() => navigator.clipboard.writeText(msg.content)}>
                                            <FiCopy size={13} />
                                        </button>
                                        <button data-tooltip="Edit" onClick={() => setInput(msg.content)}>
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
                    <button onClick={handleSend}>Send</button>
                </div>
            </div>
        </div >
    )
}


export default Chat