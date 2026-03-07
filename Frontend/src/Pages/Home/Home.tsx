import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import "./Home.css"


function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null)


    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate("/auth");
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
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 21 12 15 6" />
                                <polyline points="9 6 3 12 9 18" />
                            </svg>
                        </div>
                        <span className='logo-text'>CodeLens AI</span>
                    </div>
                    <div className="nav-user">
                        {/* user.name + user.picture */}
                        <span className='user-name'>{user?.name}</span>
                        <img className="user-avatar" src={user?.picture} alt={user?.name} />
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
                    <button className="get-started-btn" onClick={() => navigate("/chat")}>
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Home