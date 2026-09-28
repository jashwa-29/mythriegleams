import nodemailer from 'nodemailer';

const DEFAULT_STORE_EMAIL = 'mythris.gleams@gmail.com';

/**
 * Where store-side notifications go (new orders, paid orders, enquiries).
 *
 * Read lazily on every call on purpose: a module-level constant would be evaluated while
 * ES module imports are still being hoisted, which happens *before* dotenv.config() runs,
 * so the value would silently fall through to the default instead of your .env setting.
 */
export const storeNotificationEmail = (): string =>
    process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL || DEFAULT_STORE_EMAIL;

let warnedAboutSender = false;

/**
 * Gmail rejects a From address that is not the authenticated SMTP account (or a verified
 * alias), so a mismatch fails every send with an unhelpful 550. Warn once instead.
 */
const assertSenderMatchesAccount = () => {
    if (warnedAboutSender) return;

    const user = (process.env.EMAIL_USER || '').trim().toLowerCase();
    const from = (process.env.EMAIL_FROM || '').toLowerCase();
    const fromAddress = from.match(/<(.+)>/)?.[1] || from;

    if (user && fromAddress && !fromAddress.includes(user)) {
        warnedAboutSender = true;
        console.warn(
            `[email] EMAIL_FROM "${process.env.EMAIL_FROM}" does not match EMAIL_USER "${process.env.EMAIL_USER}". ` +
            'Gmail will reject these as "sender not authenticated" — align them or verify the alias.'
        );
    }
};

const sendEmail = async (options: { email: string; subject: string; message: string; html?: string }) => {
    assertSenderMatchesAccount();

    // Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Send the email
    const message = {
        from: `${process.env.EMAIL_FROM || 'Mythris Gleams <noreply@mythrisgleams.com>'}`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    const info = await transporter.sendMail(message);

    console.log('📬 Email sent to %s — %s', options.email, info.messageId);
};

export default sendEmail;
