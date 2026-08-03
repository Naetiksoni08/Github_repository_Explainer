import { FiSidebar, FiDownload } from "react-icons/fi"
import { MdKeyboardArrowDown } from "react-icons/md"
import { GoPencil } from "react-icons/go"
import { RiDeleteBin5Line } from "react-icons/ri"
import { FaRegStar } from "react-icons/fa6"
import RenameModal from "./RenameModal"

interface ChatHeaderProps {
    isSidebarCollapsed: boolean
    setIsSidebarCollapsed: (val: boolean) => void
    hasMessages: boolean
    chatTitle: string
    showSessionMenu: boolean
    setShowSessionMenu: (val: boolean) => void
    headerMenuRef: React.RefObject<HTMLDivElement | null>
    sessionId: string
    setRenameValue: (val: string) => void
    setRenameTargetId: (id: string | null) => void
    setIsRenaming: (val: boolean) => void
    handleDelete: (id: string) => void
    handleStarSession: (id: string) => void
    currentSessionStarred: boolean | undefined
    starredSessions: any[]
    isRenaming: boolean
    renameValue: string
    handleRename: () => void
    onExportPdf: () => void
}

const ChatHeader = ({
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    hasMessages,
    chatTitle,
    showSessionMenu,
    setShowSessionMenu,
    headerMenuRef,
    sessionId,
    setRenameValue,
    setRenameTargetId,
    setIsRenaming,
    handleDelete,
    handleStarSession,
    currentSessionStarred,
    starredSessions,
    isRenaming,
    renameValue,
    handleRename,
    onExportPdf
}: ChatHeaderProps) => {
    return (
        <div className='chat-header'>
            {isSidebarCollapsed && (
                <button className="floating-toggle" onClick={() => setIsSidebarCollapsed(false)}>
                    <FiSidebar size={20} />
                </button>
            )}
            {hasMessages && (
                <span className='chat-title' onClick={() => setShowSessionMenu(!showSessionMenu)}>
                    {chatTitle}
                    <MdKeyboardArrowDown size={22} />
                </span>
            )}

            {showSessionMenu && (
                <div className='session-menu' ref={headerMenuRef}>
                    <button onClick={() => {
                        setRenameValue(chatTitle);
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
            <RenameModal
                isRenaming={isRenaming}
                setIsRenaming={setIsRenaming}
                renameValue={renameValue}
                setRenameValue={setRenameValue}
                handleRename={handleRename}
            />
            {hasMessages && (
                <button className="export-pdf-btn" onClick={onExportPdf}>
                    <FiDownload size={20} />
                    Export PDF
                </button>
            )}
        </div>
    )
}

export default ChatHeader