import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    user?: mongoose.Types.ObjectId;
    orderItems: {
        name: string;
        qty: number;
        image: string;
        price: number;
        weight?: number;
        product: mongoose.Types.ObjectId | string;
        selectedVariant?: string;
        selectedColor?: string;
        customerImage?: string;
        description?: string;
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
    itemsPrice: number;
    shippingPrice: number;
    totalPrice: number;
    isPaid: boolean;
    paidAt?: Date;
    status: 'Pending' | 'Handcrafting' | 'Quality Check' | 'Dispatched' | 'Delivered' | 'Cancelled';
    /** 'offline' = logged by an admin for money received outside the store's gateway. */
    source?: 'checkout' | 'admin-custom' | 'offline' | 'guest';
    paymentToken?: string;
    trackingNumber?: string;
    deliveryNote?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    /** How the payment was confirmed. 'manual' means an admin recorded it outside the gateway. */
    paymentChannel?: 'client-verify' | 'webhook' | 'reconciler' | 'manual';
    /** How the customer actually paid, as entered by the admin for a manual confirmation. */
    paymentMethod?: string;
    /** UTR / cheque number / txn id, so a manual payment can still be traced to a bank record. */
    paymentReference?: string;
    paymentNote?: string;
    /** Audit trail for a manual confirmation. */
    markedPaidBy?: mongoose.Types.ObjectId;
    /** Denormalised so the trail survives the admin account being removed. */
    markedPaidByName?: string;
    createdAt: Date;
}

const OrderSchema: Schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for guest checkout
    orderItems: [{
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, default: '' },
        price: { type: Number, required: true },
        weight: { type: Number, default: 0 },
        product: { type: mongoose.Schema.Types.Mixed, required: true },
        selectedVariant: { type: String, default: '' },
        selectedColor: { type: String, default: '' },
        customerImage: { type: String, default: '' },
        /** Free-text instructions for the workshop — used by admin-entered (bespoke) orders. */
        description: { type: String, default: '' }
    }],
    shippingAddress: {
        label: { type: String, default: 'Home' },
        name: { type: String, required: true },
        email: { type: String, default: '' },
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zip: { type: String, default: '' },
        phone: { type: String, required: true }
    },
    itemsPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Handcrafting', 'Quality Check', 'Dispatched', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    source: {
        type: String,
        enum: ['checkout', 'admin-custom', 'offline', 'guest'],
        default: 'checkout'
    },
    paymentToken: { type: String, index: true, sparse: true },
    trackingNumber: { type: String },
    deliveryNote: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentChannel: {
        type: String,
        enum: ['client-verify', 'webhook', 'reconciler', 'manual'],
        default: undefined
    },
    paymentMethod: { type: String },
    paymentReference: { type: String },
    paymentNote: { type: String },
    markedPaidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    markedPaidByName: { type: String }
}, {
    timestamps: true
});

export default mongoose.model<IOrder>('Order', OrderSchema);
