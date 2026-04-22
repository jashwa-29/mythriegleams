import { Request, Response, NextFunction } from 'express';
import Inquiry from '../models/Inquiry';
import sendEmail from '../utils/sendEmail';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

/**
 * @desc    Submit a new inquiry (Custom/Bulk/Contact)
 * @route   POST /api/inquiries
 * @access  Public
 */
export const createInquiry = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { type, name, email, phone, subject, message, productRef } = req.body;

    const inquiryData: any = {
        type, name, email, phone, subject, message, productRef
    };

    // If file was uploaded via Multer
    if (req.file) {
        inquiryData.image = `/uploads/${req.file.filename}`;
    }

    const inquiry = await Inquiry.create(inquiryData);

    // Send confirmation email
    try {
        await sendEmail({
            email,
            subject: `Inquiry Received - #${inquiry._id}`,
            message: `Hi ${name}! We've received your ${type} design inquiry. We'll get back to you within 24–48 hours.`,
            html: `<h1>Inquiry Received! 🚀</h1><p>Your ${type} design request <strong>#${inquiry._id}</strong> has been received perfectly.</p>`
        });

        // Email Alert to Admin
        await sendEmail({
            email: process.env.ADMIN_EMAIL || 'admin@mythrisgleams.com',
            subject: `📦 NEW INQUIRY: ${type} from ${name}`,
            message: `Inquiry #${inquiry._id} - ${subject}. Check the admin dashboard for details.`
        });
    } catch (emailError) {
        console.error('Email service unavailable for inquiry:', emailError);
    }

    res.status(201).json({ success: true, data: inquiry });
});

/**
 * @desc    Get all inquiries (Admin)
 * @route   GET /api/inquiries
 * @access  Private/Admin
 */
export const getInquiries = asyncHandler(async (req: Request, res: Response) => {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: inquiries });
});

/**
 * @desc    Update inquiry status (Admin)
 * @route   PUT /api/inquiries/:id/status
 * @access  Private/Admin
 */
export const updateInquiryStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
        return next(new ErrorResponse('Inquiry for status revision not found.', 404));
    }

    inquiry.status = req.body.status || inquiry.status;
    const updatedInquiry = await inquiry.save();

    res.status(200).json({ success: true, data: updatedInquiry });
});
