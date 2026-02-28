const mongoose = require("mongoose");

async function connectdb() {
    try {
        await mongoose.connect(process.env.mongoDbURL);
        console.log("DB connected")
    } catch (error) {
        console.log("something went wrong", error);

    }
}
export default connectdb;