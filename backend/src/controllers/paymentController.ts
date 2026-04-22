import { Request, Response, NextFunction } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order';
import sendEmail from '../utils/sendEmail';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID as string,
        key_secret: process.env.RAZORPAY_KEY_SECRET as string,
    });
};

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/payment/razorpay/create
 * @access  Public (Guest/User)
 */
export const createRazorpayOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { orderId } = req.body; // Our internal MongoDB order ID

    const order = await Order.findById(orderId);
    if (!order) {
        return next(new ErrorResponse('Internal Order not found for payment initialization.', 404));
    }

    // Amount in paise
    const amountInPaise = Math.round(order.totalPrice * 100);

    const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_order_${orderId}`,
    };

    const rzp = getRazorpayInstance();
    const rzpOrder = await rzp.orders.create(options);

    if (!rzpOrder) {
        return next(new ErrorResponse('Failed to draft Razorpay payment narrative.', 500));
    }

    // Update our MongoDB order with the Razorpay order ID
    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    res.status(200).json({
        success: true,
        data: {
            id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            key: process.env.RAZORPAY_KEY_ID // Send key to frontend for initialization
        }
    });
});

/**
 * @desc    Verify Razorpay Payment
 * @route   POST /api/payment/razorpay/verify
 * @access  Public (Guest/User)
 */
export const verifyRazorpayPayment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { internalOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        // Find our order and update it
        const order: any = await Order.findById(internalOrderId).populate('user', 'name email');
        if (order) {
            order.isPaid = true;
            order.paidAt = new Date();
            order.razorpayPaymentId = razorpay_payment_id;
            order.razorpaySignature = razorpay_signature;
            order.status = 'Handcrafting'; // Start the process automatically upon payment
            await order.save();

            // Send Confirmation Emails
            try {
                // To Customer
                await sendEmail({
                    email: order.shippingAddress.email || order.user?.email || 'customer@example.com',
                    subject: `Order Confirmed! Your MythrieGleams Journey Begins - #${order._id}`,
                    message: `Hi! We've received your payment for order #${order._id}. We're already handcrafting your artisanal pieces!`,
                    html: `
                        <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px;">
                            <h1 style="color: #000; font-style: italic;">Payment Confirmed! ✨</h1>
                            <p>Thank you for choosing MythrieGleams. This is to confirm that your order <strong>#${order._id}</strong> has been successfully placed and is now proceeding to our <strong>Handcrafting</strong> stage.</p>
                            <p>We will keep you updated on your order's lifecycle.</p>
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                                <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 2px;">Order Summary</p>
                                <p style="font-size: 14px;"><strong>Order ID:</strong> ${order._id}</p>
                                <p style="font-size: 14px;"><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
                                <p style="font-size: 14px;"><strong>Total Paid:</strong> ₹${order.totalPrice}</p>
                            </div>
                        </div>
                    `
                });

                // To Admin
                await sendEmail({
                    email: process.env.ADMIN_EMAIL || 'admin@mythrisgleams.com',
                    subject: `💰 NEW PAID ORDER: #${order._id}`,
                    message: `Payment verified for order #${order._id}. Amount: ₹${order.totalPrice}. Status updated to Handcrafting.`,
                    html: `<h2>New Sale! 💰</h2><p>Order <strong>#${order._id}</strong> has been paid and is ready for fulfillment.</p><p>Customer: ${order.shippingAddress.name} (${order.shippingAddress.email})</p>`
                });
            } catch (emailError: any) {
                console.error('Email sending failed after payment verification. Error:', emailError.message);
            }
            
            return res.status(200).json({ success: true, message: 'Payment verified and registry updated.' });
        } else {
             return next(new ErrorResponse('Internal Order narrative lost during verification.', 404));
        }
    } else {
        return next(new ErrorResponse('Invalid signature detected. Payment narrative rejected.', 400));
    }
});
