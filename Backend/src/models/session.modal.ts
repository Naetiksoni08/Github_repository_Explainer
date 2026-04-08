import mongoose from 'mongoose';


const sessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
    },
    repoUrl: {
        type: String,
        default: "",
    },
    userId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        default: ""
    },
    starred: {
        type: Boolean,
        default: false,
    },
    messages: [{
        role: {
            type: String,
            required: true,
        },
        content: {
            type: String,
        },
        timestamp: {
            type: String,
        },
    }]
}, {
    timestamps: true
})




const SessionModel = mongoose.model('Session', sessionSchema);

export default SessionModel;
