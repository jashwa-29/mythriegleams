// Augments Express's Request with the raw body buffer captured by the JSON body parser.
// Required for Razorpay webhook signature verification, which signs the unparsed payload.
import 'express';

declare global {
    namespace Express {
        interface Request {
            rawBody?: Buffer;
        }
    }
}

export {};
