import { FiSidebar, FiEdit } from "react-icons/fi"
import { IoIosSearch } from "react-icons/io"
import { MdOutlineWbSunny, MdOutlineDarkMode } from "react-icons/md"
import SessionItem from "./SessionItem"

interface SidebarProps {
    isSidebarCollapsed: boolean
    setIsSidebarCollapsed: (val: boolean) => void
    handleHome: () => void
    handleNewChat: () => void
    HandleSearchClick: () => void
    isDark: boolean
    toggleTheme: () => void
    showSessions: boolean
    setShowSessions: (val: boolean) => void
    starredSessions: any[]
    normalSessions: any[]
    sessionId: string
    loadingSession: boolean
    handleSessionClick: (session: any) => void
    activeMenuSessionId: string | null
    setActiveMenuSessionId: (id: string | null) => void
    sessionMenuRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>
    setRenameValue: (val: string) => void
    setRenameTargetId: (id: string | null) => void
    setIsRenaming: (val: boolean) => void
    handleDelete: (id: string) => void
    handleStarSession: (id: string) => void
    user: any
    showLogoutModal: boolean
    setShowLogoutModal: (val: boolean) => void
    handleLogout: () => void
    logoutMenuRef: React.RefObject<HTMLDivElement | null>
}

const Sidebar = ({
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    handleHome,
    handleNewChat,
    HandleSearchClick,
    isDark,
    toggleTheme,
    showSessions,
    setShowSessions,
    starredSessions,
    normalSessions,
    sessionId,
    loadingSession,
    handleSessionClick,
    activeMenuSessionId,
    setActiveMenuSessionId,
    sessionMenuRefs,
    setRenameValue,
    setRenameTargetId,
    setIsRenaming,
    handleDelete,
    handleStarSession,
    user,
    showLogoutModal,
    setShowLogoutModal,
    handleLogout,
    logoutMenuRef
}: SidebarProps) => {
    const sessionItemProps = {
        sessionId,
        loadingSession,
        handleSessionClick,
        activeMenuSessionId,
        setActiveMenuSessionId,
        sessionMenuRefs,
        setRenameValue,
        setRenameTargetId,
        setIsRenaming,
        handleDelete,
        handleStarSession,
        starredSessions
    }

    return (
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
                <button className='theme-toggle-btn' onClick={toggleTheme}>
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
                            {starredSessions.map((session: any) => (
                                <SessionItem key={session.sessionId} session={session} {...sessionItemProps} />
                            ))}
                            <div className="sessions-divider" />
                        </>
                    )}
                    {normalSessions.map((session: any) => (
                        <SessionItem key={session.sessionId} session={session} {...sessionItemProps} />
                    ))}
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
    )
}

export default Sidebar