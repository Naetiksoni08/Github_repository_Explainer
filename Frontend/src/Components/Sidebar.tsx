import { FiSidebar, FiEdit, FiSliders, FiCheck } from "react-icons/fi"
import { IoIosSearch } from "react-icons/io"
import { MdOutlineWbSunny, MdOutlineDarkMode } from "react-icons/md"
import SessionItem from "./SessionItem"
import { useRef, useState } from "react"
import useClickOutside from "../hooks/useClickOutside";
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

    const [showFilterMenu, setShowFilterMenu] = useState(false)
    const [groupBy, setGroupBy] = useState<"none" | "date">("none")
    const filterMenuRef = useRef<HTMLDivElement>(null)
    useClickOutside(filterMenuRef, () => setShowFilterMenu(false), showFilterMenu)

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
                    <FiEdit size={18} />
                    <span>New Chat</span>
                </button>
                <button className="search-chat-btn" onClick={HandleSearchClick}>
                    <IoIosSearch size={22} />
                    <span>Search</span>
                </button>
                <button className='theme-toggle-btn' onClick={toggleTheme}>
                    {isDark ? <MdOutlineWbSunny size={22} /> : <MdOutlineDarkMode size={22} />}
                    <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                </button>
            </div>
            <div className='recent-header'>
                <span className="recent-title">Recent</span>
                <button className='hide-btn' onClick={() => setShowSessions(!showSessions)}>
                    {showSessions ? "Hide" : "Show"}
                </button>
                <div  ref={filterMenuRef} style={{ position: "relative", marginLeft: "auto" }}>
                    <button
                        className='hide-btn'
                        style={{ opacity: 1 }}
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                    >
                        <FiSliders size={14} />
                    </button>
                    {showFilterMenu && (
                        <div className="filter-menu">
                            <span className="filter-menu-label">Group by</span>
                            <button
                                className={groupBy === "none" ? "active" : ""}
                                onClick={() => { setGroupBy("none"); setShowFilterMenu(false) }}
                            >
                                <span>None</span>
                                {groupBy === "none" && <FiCheck size={16} className="check-icon" />}
                            </button>
                            <button
                                className={groupBy === "date" ? "active" : ""}
                                onClick={() => { setGroupBy("date"); setShowFilterMenu(false) }}
                            >
                                <span>Date</span>
                                {groupBy === "date" && <FiCheck size={16} className="check-icon" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {showSessions && (
                <div className="sessions-list">
                    {groupBy === "none" ? (
                        <>
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
                        </>
                    ) : (
                        groupSessionsByDate([...starredSessions, ...normalSessions]).map(group => (
                            <div key={group.label}>
                                <div className="date-group-label">{group.label}</div>
                                {group.sessions.map((session: any) => (
                                    <SessionItem key={session.sessionId} session={session} {...sessionItemProps} />
                                ))}
                            </div>
                        ))
                    )}
                </div>
            )}
            <div className='sidebar-footer'>
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
        </div>
    )
}

function groupSessionsByDate(sessions: any[]) {
    const groups: { label: string; sessions: any[] }[] = []
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    const todaySessions = sessions.filter(s => new Date(s.createdAt).toDateString() === today)
    const yesterdaySessions = sessions.filter(s => new Date(s.createdAt).toDateString() === yesterday)
    const olderSessions = sessions.filter(s => {
        const d = new Date(s.createdAt).toDateString()
        return d !== today && d !== yesterday
    })

    if (todaySessions.length) groups.push({ label: "Today", sessions: todaySessions })
    if (yesterdaySessions.length) groups.push({ label: "Yesterday", sessions: yesterdaySessions })
    if (olderSessions.length) groups.push({ label: "Older", sessions: olderSessions })

    return groups
}

export default Sidebar