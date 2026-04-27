import app from './app';
import connectDB from './config/db';
import dotenv from 'dotenv';
import Order from './models/Order';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();
 
const server = app.listen(PORT, () => {
    console.log(`🚀 Mythris Gleams Server running in ${process.env.NODE_ENV || 'production'} mode on http://localhost:${PORT}`);
});

// Background job to clean up pending (unpaid) orders older than 20 minutes
const cleanPendingOrders = async () => {
    try {
        const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
        const result = await Order.deleteMany({
            isPaid: false,
            createdAt: { $lt: twentyMinutesAgo }
        });
        if (result.deletedCount > 0) {
            console.log(`🧹 Background Job: Cleaned up ${result.deletedCount} pending orders older than 20 minutes.`);
        }
    } catch (error: any) {
        console.error(`❌ Background Job Error (Order Cleanup): ${error.message}`);
    }
};

// Run immediately when server starts
cleanPendingOrders();

// Check every 1 minute
setInterval(cleanPendingOrders, 1 * 60 * 1000);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise) => {
    console.error(`❌ Unhandled Error: ${err.message}`);
    // Close server & exit process
    // server.close(() => process.exit(1)); 
});
