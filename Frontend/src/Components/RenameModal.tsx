import { IoClose } from 'react-icons/io5'

interface RenameModalProps {
    isRenaming: boolean
    setIsRenaming: (val: boolean) => void
    renameValue: string
    setRenameValue: (val: string) => void
    handleRename: () => void
}

const RenameModal = ({ isRenaming, setIsRenaming, renameValue, setRenameValue, handleRename }: RenameModalProps) => {
    if (!isRenaming) return null

    return (
        <div className="rename-overlay" onClick={() => setIsRenaming(false)}>
            <div className="rename-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rename-modal-header">
                    <span>Edit name</span>
                    <button className="rename-modal-close" onClick={() => setIsRenaming(false)}>
                        <IoClose size={18} />
                    </button>
                </div>
                <input
                    autoFocus
                    className="rename-modal-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename()
                        if (e.key === "Escape") setIsRenaming(false)
                    }}
                />
                <div className="rename-modal-actions">
                    <button className="rename-modal-cancel" onClick={() => setIsRenaming(false)}>Cancel</button>
                    <button className="rename-modal-confirm" onClick={handleRename}>Confirm</button>
                </div>
            </div>
        </div>
    )
}

export default RenameModal