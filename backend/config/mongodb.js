import mongoose from "mongoose";

const connectDB = async () => {

    mongoose.connection.on('connected', () => console.group("Database Connected"))

    await mongoose.connect(`${process.env.MONGODB_URI}/prescribia`);
}

export default connectDB