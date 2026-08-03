interface SessionLimitBannerProps {
    isHardLimit: boolean
    isSoftLimit: boolean
    warningDismissed: boolean
    setWarningDismissed: (val: boolean) => void
    handleNewChat: () => void
}

const SessionLimitBanner = ({
    isHardLimit,
    isSoftLimit,
    warningDismissed,
    setWarningDismissed,
    handleNewChat
}: SessionLimitBannerProps) => {
    if (isHardLimit) {
        return (
            <div className="session-limit-banner hard">
                <span>This conversation has reached its limit. Please start a new chat to continue.</span>
                <button onClick={handleNewChat}>Start New Chat</button>
            </div>
        )
    }

    if (isSoftLimit && !warningDismissed) {
        return (
            <div className="session-limit-banner soft">
                <span>This conversation is getting long. Starting fresh keeps things fast.</span>
                <div className="session-limit-actions">
                    <button className="continue-btn" onClick={() => setWarningDismissed(true)}>Continue</button>
                    <button className="new-chat-btn-inline" onClick={handleNewChat}>Start New Chat</button>
                </div>
            </div>
        )
    }

    return null
}

export default SessionLimitBanner