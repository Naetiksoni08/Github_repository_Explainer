interface DeleteModalProps {
    showDeleteModal: boolean
    setShowDeleteModal: (val: boolean) => void
    confirmDelete: () => void
}

const DeleteModal = ({ showDeleteModal, setShowDeleteModal, confirmDelete }: DeleteModalProps) => {
    if (!showDeleteModal) return null

    return (
        <div className="delete-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                <p>Are you sure you want to delete this chat?</p>
                <div className="delete-modal-actions">
                    <button className="delete-modal-cancel" onClick={() => setShowDeleteModal(false)}>No</button>
                    <button className="delete-modal-confirm" onClick={confirmDelete}>Yes, Delete</button>
                </div>
            </div>
        </div>
    )
}

export default DeleteModal