import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

export const seedAdmin = async () => {
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
    } catch (error) {
        console.error('❌ Error creating Admin: ', error);
    }
};
