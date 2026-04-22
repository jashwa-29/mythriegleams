import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import connectDB from '../config/db';

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        // Check if admin exists
        const adminExists = await User.findOne({ email: 'admin@mythrisgleams.com' });

        if (adminExists) {
            console.log('💡 Admin user already exists.');
            process.exit(0);
        }

        // Create Admin
        await User.create({
            name: 'Uma Gayathri (Admin)',
            email: 'admin@mythrisgleams.com',
            password: 'password123',
            role: 'admin'
        });

        console.log('✅ Admin User Created Successfully!');
        console.log('📧 Email: admin@mythrisgleams.com');
        console.log('🔑 Password: password123');
        process.exit(0);
    } catch (error: any) {
        console.error(`❌ Error seeding admin: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
