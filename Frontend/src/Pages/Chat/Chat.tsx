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
        navigate("/chat")
    }

    const handleLogout = () => {
        localStorage.clear();
        navigate("/auth")
        toast.success("Logged out successfully");
    }

    const HandleSearchClick = async () => {
        const response = await api.get('/api/search', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
    }

    return (
        <div className="chat-wrapper">
            <div className={`sidebar ${isSidebarCollapsed ? "hidden" : ""}`}>
                <div className="sidebar-header">
                    <div className="nav-logo">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 21 12 15 6" />
                            <polyline points="9 6 3 12 9 18" />
                        </svg>
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
                    <div className='user-profile' onClick={() => setShowLogoutModal(!showLogoutModal)}>
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
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="message assistant">
                            <Loader />
                        </div>
                    )}
                    <div ref={messagesEndRef}></div>
                </div>
                <div className="input-area">
                    <input
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        type="text"
                        placeholder={repoIngested ? "Ask anything about the repo..." : "Paste GitHub URL to get started..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button onClick={handleSend}>Send</button>
                </div>
            </div>
        </div >
    )
}

export default Chat