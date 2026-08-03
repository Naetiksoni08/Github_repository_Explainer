import { useEffect, useRef, useState } from 'react'
import "./Chat.css"
import Loader from '../../Components/Loader';
import { useNavigate } from 'react-router-dom';
import ThinkingLoader from "../../Components/ThinkerLoader"
import { MdKeyboardArrowDown } from 'react-icons/md';
import useClickOutside from '../../utils/useClickOutside';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useScrollBehavior } from '../../hooks/useScrollBehavior'
import { usePastedFiles } from '../../hooks/usePastedFiles'
import { useSessions } from '../../hooks/useSessions'
import { useIngest } from '../../hooks/useIngest'
import { useChatMessages } from '../../hooks/useChatMessages'
import DeleteModal from '../../Components/DeleteModal'
import SearchModal from '../../Components/SearchModal'
import Sidebar from '../../Components/Sidebar'
import IngestProgress from '../../Components/IngestProgress'
import SessionLimitBanner from '../../Components/SessionLimitBanner'
import ChatHeader from '../../Components/ChatHeader'
import MessageBubble from '../../Components/MessageBubble'
import ChatInput from '../../Components/ChatInput'
import { exportChatAsPdf } from '../../utils/pdfExport'
import { useTheme } from '../../hooks/useTheme'
import { useAppInit } from '../../hooks/useAppInit'

const Chat = () => {
    const [messages, setMessages] = useState<any[]>([])
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const [showSessionMenu, setShowSessionMenu] = useState(false)
    const [warningDismissed, setWarningDismissed] = useState(false)
    const headerMenuRef = useRef<HTMLDivElement>(null)
    const logoutMenuRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const navigate = useNavigate()
    const {
        sessions, sessionId, repoUrl, setRepoUrl, repoIngested, setRepoIngested,
        loadingSession, showSessions, setShowSessions, searchQuery, setSearchQuery,
        showSearch, setShowSearch, activeMenuSessionId, setActiveMenuSessionId,
        setRenameTargetId, renameValue, setRenameValue,
        isRenaming, setIsRenaming, showDeleteModal, setShowDeleteModal,
        sessionMenuRefs, Filtersession, starredSessions, normalSessions, currentSessionStarred,
        fetchSession, handleSessionClick, handleNewChat, handleHome, HandleSearchClick,
        handleRename, handleStarSession, handleDelete, confirmDelete
    } = useSessions({
        setMessages,
        onSessionLoaded: (msgs) => setMessages(msgs),
        onNewChat: () => setMessages([]),
        resetWarning: () => setWarningDismissed(false),
        navigate
    })

    const { user, githubRepos, handleLogout } = useAppInit({ handleSessionClick, fetchSession, navigate })
    const { isDark, toggleTheme } = useTheme()

    const { ingestProgress, handleIngestWithProgress } = useIngest(sessionId)

    const {
        pastedFiles, previewFile, setPreviewFile, handlePaste,
        removePastedFile, buildAttachmentsText, clearPastedFiles
    } = usePastedFiles(() => textareaRef.current?.focus())

    const HARD_LIMIT = 100

    const {
        input, setInput, loading, editingIndex, setEditingIndex, editValue, setEditValue,
        handleSend, handleRetry, handleAbort
    } = useChatMessages({
        messages, setMessages, sessionId, repoUrl, repoIngested, setRepoIngested, setRepoUrl,
        fetchSession, handleIngestWithProgress, pastedFiles, buildAttachmentsText,
        clearPastedFiles, focusTextarea: () => textareaRef.current?.focus(),
        hardLimit: HARD_LIMIT
    })

    const { isListening, interimText, handleMicClick, displayValue } = useVoiceInput(input, setInput)
    const { messagesEndRef, messagesAreaRef, showScrollButton, scrollToBottom } = useScrollBehavior(messages)

    const SOFT_LIMIT = 80

    const isSoftLimit = messages.length >= SOFT_LIMIT && messages.length < HARD_LIMIT
    const isHardLimit = messages.length >= HARD_LIMIT


    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    }, [input, interimText])


    useClickOutside(headerMenuRef, () => setShowSessionMenu(false), showSessionMenu)
    useClickOutside(logoutMenuRef, () => setShowLogoutModal(false), showLogoutModal)
    return (
        <div className={`chat-wrapper ${isDark ? "dark" : "light"}`}>
            <SearchModal
                showSearch={showSearch}
                setShowSearch={setShowSearch}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                Filtersession={Filtersession}
                handleSessionClick={handleSessionClick}
            />
            <DeleteModal
                showDeleteModal={showDeleteModal}
                setShowDeleteModal={setShowDeleteModal}
                confirmDelete={confirmDelete}
            />
            <Sidebar
                isSidebarCollapsed={isSidebarCollapsed}
                setIsSidebarCollapsed={setIsSidebarCollapsed}
                handleHome={handleHome}
                handleNewChat={handleNewChat}
                HandleSearchClick={HandleSearchClick}
                isDark={isDark}
                toggleTheme={toggleTheme}
                showSessions={showSessions}
                setShowSessions={setShowSessions}
                starredSessions={starredSessions}
                normalSessions={normalSessions}
                sessionId={sessionId}
                loadingSession={loadingSession}
                handleSessionClick={handleSessionClick}
                activeMenuSessionId={activeMenuSessionId}
                setActiveMenuSessionId={setActiveMenuSessionId}
                sessionMenuRefs={sessionMenuRefs}
                setRenameValue={setRenameValue}
                setRenameTargetId={setRenameTargetId}
                setIsRenaming={setIsRenaming}
                handleDelete={handleDelete}
                handleStarSession={handleStarSession}
                user={user}
                showLogoutModal={showLogoutModal}
                setShowLogoutModal={setShowLogoutModal}
                handleLogout={handleLogout}
                logoutMenuRef={logoutMenuRef}
            />
            <div className={`chat-main ${messages.length === 0 && githubRepos.length === 0 && !loadingSession ? 'empty-chat' : ''}`}>
                <ChatHeader
                    isSidebarCollapsed={isSidebarCollapsed}
                    setIsSidebarCollapsed={setIsSidebarCollapsed}
                    hasMessages={messages.length > 0}
                    chatTitle={sessions.find(s => s.sessionId === sessionId)?.title || "New Chat"}
                    showSessionMenu={showSessionMenu}
                    setShowSessionMenu={setShowSessionMenu}
                    headerMenuRef={headerMenuRef}
                    sessionId={sessionId}
                    setRenameValue={setRenameValue}
                    setRenameTargetId={setRenameTargetId}
                    setIsRenaming={setIsRenaming}
                    handleDelete={handleDelete}
                    handleStarSession={handleStarSession}
                    currentSessionStarred={currentSessionStarred}
                    starredSessions={starredSessions}
                    isRenaming={isRenaming}
                    renameValue={renameValue}
                    handleRename={handleRename}
                    onExportPdf={() => exportChatAsPdf(messages, sessions.find(s => s.sessionId === sessionId)?.title || "Chat Export")}
                />
                <div className="messages-area" ref={messagesAreaRef}>
                    {loadingSession ? (
                        <Loader />
                    ) : ingestProgress ? (
                        <IngestProgress ingestProgress={ingestProgress} />
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
                                <h2>What Repository would you like to analyze?</h2>
                            </div>
                        )
                    ) : (
                        messages.map((msg, index) => (
                            <MessageBubble
                                key={index}
                                msg={msg}
                                index={index}
                                messages={messages}
                                sessionId={sessionId}
                                setMessages={setMessages}
                                editingIndex={editingIndex}
                                setEditingIndex={setEditingIndex}
                                editValue={editValue}
                                setEditValue={setEditValue}
                                copiedIndex={copiedIndex}
                                setCopiedIndex={setCopiedIndex}
                                handleRetry={handleRetry}
                                handleSend={handleSend}
                            />
                        ))
                    )}
                    {loading && !ingestProgress && (
                        <div className="message assistant">
                            <ThinkingLoader />
                        </div>
                    )}
                    <div ref={messagesEndRef}></div>
                </div>
                {showScrollButton && (
                    <button className="scroll-to-bottom-btn" onClick={scrollToBottom}>
                        <MdKeyboardArrowDown size={20} />
                    </button>
                )}

                <SessionLimitBanner
                    isHardLimit={isHardLimit}
                    isSoftLimit={isSoftLimit}
                    warningDismissed={warningDismissed}
                    setWarningDismissed={setWarningDismissed}
                    handleNewChat={handleNewChat}
                />
                {!loadingSession && (
                    <ChatInput
                        textareaRef={textareaRef}
                        pastedFiles={pastedFiles}
                        setPreviewFile={setPreviewFile}
                        removePastedFile={removePastedFile}
                        handlePaste={handlePaste}
                        handleSend={handleSend}
                        handleAbort={handleAbort}
                        isHardLimit={isHardLimit}
                        repoIngested={repoIngested}
                        displayValue={displayValue}
                        input={input}
                        setInput={setInput}
                        isListening={isListening}
                        interimText={interimText}
                        handleMicClick={handleMicClick}
                        loading={loading}
                        previewFile={previewFile}
                    />
                )}

            </div>
        </div>
    )
}

export default Chat