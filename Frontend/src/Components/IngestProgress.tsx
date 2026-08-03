interface IngestProgressProps {
    ingestProgress: {
        stage: string
        percent: number
    } | null
}

const IngestProgress = ({ ingestProgress }: IngestProgressProps) => {
    if (!ingestProgress) return null

    return (
        <div className="ingest-progress-wrapper">
            <div className="ingest-progress-label">
                <span>
                    {ingestProgress.stage === "starting" && "Starting..."}
                    {ingestProgress.stage === "loading" && "Loading repository files..."}
                    {ingestProgress.stage === "chunking" && "Chunking code..."}
                    {ingestProgress.stage === "cleaning" && "Cleaning chunks..."}
                    {ingestProgress.stage === "storing" && "Storing in vector database..."}
                </span>
                <span>{ingestProgress.percent}%</span>
            </div>
            <div className="ingest-progress-track">
                <div className="ingest-progress-fill" style={{ width: `${ingestProgress.percent}%` }} />
            </div>
        </div>
    )
}

export default IngestProgress