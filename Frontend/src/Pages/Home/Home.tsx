import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import "./Home.css"
import toast from 'react-hot-toast';


function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null)
    const [openMenu, setOpenMenu] = useState(false)


    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, [])
    return (
        <div>
            <div className="home-wrapper">
                {/* Navbar */}

                <nav className="navbar">
                    <div className="nav-logo">
                        <div className='logo-icon'>
                            {/* SVG + CodeLens AI */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 21 12 15 6" />
                                <polyline points="9 6 3 12 9 18" />
                            </svg>
                        </div>
                        <span className='logo-text'>CodeLens AI</span>
                    </div>
                    <div className="nav-user">

                        <img
                            className="user-avatar"
                            src={user?.picture || "/avatar.svg"}
                            alt="avatar"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/avatar.svg" }}
                            onClick={() => user && setOpenMenu(!openMenu)}
                            style={{ cursor: user ? "pointer" : "default" }}
                        />


                        {openMenu && (
                            <div className="user-menu">
                                <button
                                    className="logout-btn"
                                    onClick={() => {
                                        localStorage.removeItem("user");
                                        navigate("/auth");
                                    }}
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Hero Section */}
                <div className="hero">
                    <h1 className="hero-title">
                        Understand any GitHub repository
                        <span className="hero-highlight"> through intelligent conversation</span>
                    </h1>
                    <p className="hero-subtitle">
                        Paste a GitHub URL and ask anything — CodeLens AI analyzes your codebase and answers with context.
                    </p>
                    <div className="hero-actions">
                        <button className="get-started-btn" onClick={() => {
                            if (!user) {
                                toast.error("Sign in to get started")
                            } else {
                                navigate("/chat")
                            }
                        }}>
                            Get Started
                        </button>
                        {!user && (
                            <button className="signin-btn" onClick={() => navigate("/auth")}>Sign In</button>
                        )}
                    </div>
                </div>
            </div>
        </div >
    )
}

export default Home