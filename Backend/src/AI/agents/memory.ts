import SessionModel from "../../models/session.modal";
import { Document } from "mongoose";
import llm from "..";

async function getOrCreateSession(sessionId: string, repoUrl: string, userId: string,query:string): Promise<Document> {
    const session = await SessionModel.findOne({ sessionId });
    if (!session) {

        const title = query? (await llm.invoke(`Give a 5-6 word title for a chat session where the user asked: "${query}" about this repo: ${repoUrl}. Return  
            ONLY the title.`)).content as string                                                                                                  
                : repoUrl.split("/").pop() || "New Chat" 
                
        // const title = titleResponse.content as string;

        const newSession = await SessionModel.create({
            sessionId,
            repoUrl,
            userId,
            title,
            messages: []
        })
        return newSession as Document;
    }
    return session as Document;

}



// why did we imported mongoose here what is this document in mongoose?
// when we try to get or create anything in mongoose then it is not a plain js object rather it is a mongoose document object which has some powers like .save() , .find() , .update() , .delete() , etc.


// now why did we write as Document?
// basically ts doesnt exactly know that sessionmodel.create or findone will return what and internally the type of this line is complex so we are just saying ts that bro relax this is amongoose docuement treat it like that thats why we are using as document



async function AddMessage(sessionId: string, role: string, content: string): Promise<void> {
    const isSession = await SessionModel.findOne({ sessionId });
    if (isSession) {
        isSession.messages.push({ role, content, timestamp: new Date().toISOString() })
        await isSession.save();
    }
}

async function getMessages(sessionId: string): Promise<any[]> {
    const session = await SessionModel.findOne({ sessionId });
    if (!session) {
        return [];
    }
    return session.messages;

}

export { getOrCreateSession, AddMessage, getMessages };