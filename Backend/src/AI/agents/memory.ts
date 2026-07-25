import SessionModel from "../../models/session.modal";
import { Document } from "mongoose";
import llmPromise from "../index";

const MAX_HISTORY_MESSAGES = 15;
const MAX_HISTORY_CHARS = 4000;

async function getOrCreateSession(sessionId: string, repoUrl: string, userId: string, query: string): Promise<Document> {
    const session = await SessionModel.findOne({ sessionId });
    if (!session) {
        let title: string;
        try {
            const llm = await llmPromise;
            if (repoUrl) {
                title = repoUrl.split("/").filter(Boolean).pop() || "New Chat";
            } else {
                const result = await llm.invoke(`Generate a short 4-5 word chat title for this message: "${query.slice(0, 200)}". Return ONLY the title, no quotes, no punctuation.`);
                title = (result.content as string)?.trim() || "New Chat";
            }
        } catch {
            title = "New Chat";
        }

        const newSession = await SessionModel.create({
            sessionId,
            repoUrl,
            userId,
            title,
            messages: []
        });
        return newSession as Document;
    }
    return session as Document;
}

async function AddMessage(sessionId: string, role: string, content: string): Promise<void> {
    const session = await SessionModel.findOne({ sessionId });
    if (!session) return;

    session.messages.push({
        role,
        content,
        timestamp: new Date().toISOString()
    });

    // FIX: splice use karo, slice nahi — DocumentArray intact rahega
    if (session.messages.length > 100) {
        session.messages.splice(0, session.messages.length - 100);
    }

    await session.save();
}

async function getMessages(sessionId: string): Promise<any[]> {
    const session = await SessionModel.findOne({ sessionId });
    if (!session || !session.messages) return [];

    // Convert to plain JS array first (DocumentArray se chhutkara)
    let messages = session.messages.map((m: any) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
    }));

    // 1. Last 15 messages
    messages = messages.slice(-MAX_HISTORY_MESSAGES);

    // 2. Char budget check
    let totalChars = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    while (totalChars > MAX_HISTORY_CHARS && messages.length > 3) {
        messages.shift();
        totalChars = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    }

    return messages;
}

export { getOrCreateSession, AddMessage, getMessages };