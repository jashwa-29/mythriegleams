import app from './app';
import connectDB from './config/db';
import dotenv from 'dotenv';
import { seedAdmin } from './seedAdmin';
import { createOrderReconciler, RECONCILE_INTERVAL_MS } from './services/orderReconciler';
dotenv.config();

const PORT = process.env.PORT || 5010;

// Connect to Database
connectDB();
seedAdmin();
 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const server = app.listen(PORT, () => {
    console.log(`🚀 Mythris Gleams Server running in ${process.env.NODE_ENV || 'production'} mode on http://localhost:${PORT}`);
}); 

// Run once on boot, then on a timer. Reconciles missed payments with Razorpay before
// anything is cleaned up, and never touches admin custom orders.
const reconcileAndCleanOrders = createOrderReconciler();
reconcileAndCleanOrders();
setInterval(reconcileAndCleanOrders, RECONCILE_INTERVAL_MS);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise) => {
    console.error(`❌ Unhandled Error: ${err.message}`);
    // Close server & exit process
    // server.close(() => process.exit(1)); 
});
