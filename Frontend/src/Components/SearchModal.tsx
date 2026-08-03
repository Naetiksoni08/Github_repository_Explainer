interface SearchModalProps {
    showSearch: boolean
    setShowSearch: (val: boolean) => void
    searchQuery: string
    setSearchQuery: (val: string) => void
    Filtersession: any[]
    handleSessionClick: (session: any) => void
}

const SearchModal = ({
    showSearch,
    setShowSearch,
    searchQuery,
    setSearchQuery,
    Filtersession,
    handleSessionClick
}: SearchModalProps) => {
    if (!showSearch) return null

    return (
        <div className="search-overlay" onClick={() => { setShowSearch(false); setSearchQuery("") }}>
            <div className="search-modal" onClick={(e) => e.stopPropagation()}>
                <input
                    autoFocus
                    type="text"
                    placeholder="Search sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                <div className="search-results">
                    {Filtersession.length > 0 ? (
                        Filtersession.map((session: any) => (
                            <div key={session.sessionId} className="search-result-item"
                                onClick={() => {
                                    handleSessionClick(session)
                                    setShowSearch(false)
                                    setSearchQuery("")
                                }}>
                                <span>{session.title || "Untitled"}</span>
                            </div>
                        ))
                    ) : (
                        <p className="not-found">No sessions found</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default SearchModal