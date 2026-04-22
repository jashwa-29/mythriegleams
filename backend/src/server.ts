import app from './app';
import connectDB from './config/db';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();
 
const server = app.listen(PORT, () => {
    console.log(`🚀 Mythris Gleams Server running in ${process.env.NODE_ENV || 'production'} mode on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise) => {
    console.error(`❌ Unhandled Error: ${err.message}`);
    // Close server & exit process
    // server.close(() => process.exit(1)); 
});
