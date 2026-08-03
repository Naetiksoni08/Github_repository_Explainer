import { HiEllipsisVertical } from "react-icons/hi2"
import { GoPencil } from "react-icons/go"
import { RiDeleteBin5Line } from "react-icons/ri"
import { FaRegStar } from "react-icons/fa6"

interface SessionItemProps {
    session: any
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
    starredSessions: any[]
}

const SessionItem = ({
    session,
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
}: SessionItemProps) => {
    return (
        <div
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
}

export default SessionItem