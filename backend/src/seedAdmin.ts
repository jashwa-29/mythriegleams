import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';
import User from './models/User';

dotenv.config();

connectDB();

const seedAdmin = async () => {
    try {
        const adminEmail = 'admin@mythrisgleams.com';
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (existingAdmin) {
            existingAdmin.password = 'password123';
            await existingAdmin.save();
            console.log('✅ Admin password forcefully reset to: password123');
        } else {
            const adminUser = new User({
                name: 'Chief Artisan',
                email: adminEmail,
                password: 'password123',
                role: 'admin'
            });
            await adminUser.save();
            console.log('✅ Default Admin Created: admin@mythrisgleams.com | password123');
        }
        process.exit();
    } catch (error) {
        console.error('❌ Error creating Admin: ', error);
        process.exit(1);
    }
};

seedAdmin();
