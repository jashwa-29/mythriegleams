import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiry extends Document {
    type: 'custom' | 'bulk' | 'contact';
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    image?: string; // Captured via Multer
    productRef?: mongoose.Types.ObjectId;
    status: 'new' | 'responded' | 'closed';
    createdAt: Date;
}

const InquirySchema: Schema = new Schema({
    type: { type: String, enum: ['custom', 'bulk', 'contact'], required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    image: { type: String }, // Path to uploaded reference design
    productRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    status: { type: String, enum: ['new', 'responded', 'closed'], default: 'new' }
}, {
    timestamps: true
});

export default mongoose.model<IInquiry>('Inquiry', InquirySchema);
