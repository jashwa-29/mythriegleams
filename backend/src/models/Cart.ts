import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
    product: mongoose.Types.ObjectId;
    name: string;
    image: string;
    price: number;
    quantity: number;
    selectedVariant?: string;
}

export interface ICart extends Document {
    user: mongoose.Types.ObjectId;
    items: ICartItem[];
    updatedAt: Date;
}

const CartItemSchema = new Schema({
    product:         { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name:            { type: String, required: true },
    image:           { type: String, default: '' },
    price:           { type: Number, required: true },
    quantity:        { type: Number, required: true, min: 1, default: 1 },
    selectedVariant: { type: String, default: '' },
});

const CartSchema: Schema = new Schema({
    user:  { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [CartItemSchema],
}, { timestamps: true });

export default mongoose.model<ICart>('Cart', CartSchema);
