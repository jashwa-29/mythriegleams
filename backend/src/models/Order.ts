import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    user?: mongoose.Types.ObjectId;
    orderItems: {
        name: string;
        qty: number;
        image: string;
        price: number;
        product: mongoose.Types.ObjectId;
    }[];
    shippingAddress: {
        label?: string;
        name: string; // The Recipient
        email: string; // Dispatch Notification Destination
        street: string;
        city: string;
        state: string;
        zip: string;
        phone: string;
    };
    totalPrice: number;
    isPaid: boolean;
    paidAt?: Date;
    status: 'Pending' | 'Handcrafting' | 'Quality Check' | 'Dispatched' | 'Delivered' | 'Cancelled';
    trackingNumber?: string;
    deliveryNote?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    createdAt: Date;
}

const OrderSchema: Schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for guest checkout
    orderItems: [{
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }
    }],
    shippingAddress: {
        label: { type: String, default: 'Home' },
        name: { type: String, required: true },
        email: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true },
        phone: { type: String, required: true }
    },
    totalPrice: { type: Number, required: true, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Handcrafting', 'Quality Check', 'Dispatched', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    trackingNumber: { type: String },
    deliveryNote: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String }
}, {
    timestamps: true
});

export default mongoose.model<IOrder>('Order', OrderSchema);
