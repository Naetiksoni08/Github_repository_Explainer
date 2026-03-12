import { useEffect, useRef, useState } from 'react'
import "./Chat.css"
import { FiEdit } from "react-icons/fi";
import toast from 'react-hot-toast'
import api from '../../utils/axios';
import ReactMarkdown from 'react-markdown'

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

    const handleSessionClick = async (session: any) => {
        const response = await api.get(`/api/sessions/${session.sessionId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })

        const data = response.data.data;
        setSessionId(data.sessionId);
        setRepoUrl(data.repoUrl);
        setRepoIngested(true);
        setMessages(data.messages)

    }


    const fetchSession = async () => {
        const response = await api.get('/api/sessions', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        console.log(response.data)
        setSessions(response.data.data);
    }


    useEffect(() => {
        setSessionId(crypto.randomUUID());
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
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
                //Ingestion Api Call
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
            console.log(error)
            toast.error(error?.response?.data?.message || "Something Went Wrong")
        } finally {
            setLoading(false);
        }

    }




    return (
        <div className="chat-wrapper">

            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="nav-logo">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 21 12 15 6" />
                            <polyline points="9 6 3 12 9 18" />
                        </svg>
                        <h2 className="text-logo">CodeLens AI</h2>
                    </div>
                    <button className="new-chat-btn">
                        <FiEdit size={16} />
                        <span>New Chat</span>
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
                        {/* sessions map */}
                        {sessions.map((session: any) => (
                            <div key={session.sessionId} className='session-item' onClick={() => handleSessionClick(session)}>
                                <span>{session.title}</span>
                            </div>
                        ))}

                    </div>
                )}
            </div>

            {/* Main Chat Area */}
            <div className="chat-main">

                {/* Messages Area */}
                <div className="messages-area">

                    {messages.length === 0 ? (
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
                            <p>Thinking...</p>
                        </div>
                    )}
                </div>
                {/* Input Area */}
                <div className="input-area">
                    <input onKeyDown={(e) => e.key === "Enter" && handleSend()}
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