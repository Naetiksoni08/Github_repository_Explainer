import { jsPDF } from 'jspdf'
import toast from 'react-hot-toast'

export const exportChatAsPdf = (messages: any[], sessionTitle: string) => {
    if (messages.length === 0) return

    const doc = new jsPDF({ unit: "mm", format: "a4" })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const maxWidth = pageWidth - margin * 2
    let y = 20

    // Title
    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text(sessionTitle, margin, y)
    y += 8

    // Date subtitle
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(`Exported on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`, margin, y)
    y += 10

    // Separator
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    for (const msg of messages) {
        const isUser = msg.role === "user"
        const label = isUser ? "You" : "CodeLens AI"

        // Page overflow check
        if (y + 20 > pageHeight - 15) {
            doc.addPage()
            y = 15
        }

        // Role label
        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.setTextColor(isUser ? 80 : 30, isUser ? 80 : 120, isUser ? 80 : 80)
        doc.text(label, margin, y)
        y += 6

        // Clean markdown from content
        const cleaned = (msg.content || "")
            .replace(/```[\s\S]*?```/g, (match: string) => {
                return match.replace(/```\w*\n?/g, "").replace(/```/g, "").trim()
            })
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .replace(/\*(.*?)\*/g, "$1")
            .replace(/#{1,6}\s/g, "")
            .replace(/`([^`]+)`/g, "$1")

        // Write content with line wrapping
        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        doc.setTextColor(50, 50, 50)

        const lines = doc.splitTextToSize(cleaned, maxWidth)
        for (const line of lines) {
            if (y + 6 > pageHeight - 15) {
                doc.addPage()
                y = 15
            }
            doc.text(line, margin, y)
            y += 5
        }

        y += 6
        if (y + 4 > pageHeight - 15) {
            doc.addPage()
            y = 15
        }
        doc.setDrawColor(230, 230, 230)
        doc.line(margin, y, pageWidth - margin, y)
        y += 6
    }

    const filename = sessionTitle.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50)
    doc.save(`${filename}.pdf`)
    toast.success("PDF downloaded!")
}