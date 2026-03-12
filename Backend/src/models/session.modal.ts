import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
    },
    repoUrl: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        default: ""
    },
    messages: [{
        role: {
            type: String,
            required: true,
        },
        content: {
            type: String,
        }
    }]
}, {
    timestamps: true
})




const SessionModel = mongoose.model('Session', sessionSchema);

export default SessionModel;
