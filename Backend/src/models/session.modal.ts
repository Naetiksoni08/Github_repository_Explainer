import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
        sessionId: {
            type: String,
            required: true,
        },
        repourl: {
            type: String,
            required: true,
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
},{
    timestamps: true
})




const SessionModel = mongoose.model('Session',sessionSchema);

export default SessionModel;
