import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mythris_gleams';
        const conn = await mongoose.connect(mongoURI);
        console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`❌ DB Connection Error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;
