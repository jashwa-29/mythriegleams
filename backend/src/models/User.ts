import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'user' | 'admin';
    phone?: string;
    marketingConsent: boolean;
    addresses: {
        label: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        isDefault: boolean;
    }[];
    matchPassword: (enteredPassword: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, select: false }, // Don't return password by default
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    phone: { type: String },
    marketingConsent: { type: Boolean, default: true },
    addresses: [{
        label: { type: String, default: 'Home' }, // Home, Office, etc.
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zip: { type: String },
        isDefault: { type: Boolean, default: false }
    }]
}, {
    timestamps: true
});

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
});

// Compare password
UserSchema.methods.matchPassword = async function(enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
