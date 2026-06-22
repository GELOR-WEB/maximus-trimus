/**
 * Email Service — Nodemailer utility for sending password reset emails.
 * Uses SMTP credentials from environment variables.
 */

const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT) || 587;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !user || !pass) {
        console.warn(
            '⚠️  Email environment variables missing!',
            'EMAIL_HOST:', !!host,
            'EMAIL_USER:', !!user,
            'EMAIL_PASS:', !!pass
        );
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: { user, pass },
    });
};

/**
 * Send a password reset email with a branded HTML template.
 * @param {string} to - Recipient email address
 * @param {string} resetLink - Full URL to the reset password page with token
 * @param {string} userName - The user's display name (for personalisation)
 */
async function sendResetEmail(to, resetLink, userName) {
    const transporter = createTransporter();

    if (!transporter) {
        console.error('Password reset email skipped: email not configured');
        return null;
    }

    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#141414; font-family:'Segoe UI',Roboto,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#141414; padding:40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background:rgba(30,30,30,0.95); border-radius:12px; border:1px solid #333; overflow:hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding:32px 40px 20px; text-align:center; border-bottom:1px solid #333;">
                            <h1 style="margin:0; font-family:Georgia,'Times New Roman',serif; color:#FFD700; font-size:24px; letter-spacing:1px;">
                                MAXIMUS TRIMUS
                            </h1>
                            <p style="margin:8px 0 0; color:#888; font-size:13px; letter-spacing:2px; text-transform:uppercase;">
                                Barbershop
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:32px 40px;">
                            <h2 style="margin:0 0 16px; color:#f5deb3; font-size:20px; font-weight:600;">
                                Password Reset Request
                            </h2>
                            <p style="margin:0 0 20px; color:#ccc; font-size:15px; line-height:1.6;">
                                Hi ${userName || 'there'},
                            </p>
                            <p style="margin:0 0 24px; color:#ccc; font-size:15px; line-height:1.6;">
                                We received a request to reset the password for your account. Click the button below to set a new password:
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="padding:8px 0 28px;">
                                        <a href="${resetLink}" 
                                           style="display:inline-block; padding:14px 36px; background-color:#FFD700; color:#141414; text-decoration:none; border-radius:6px; font-weight:bold; font-size:15px; letter-spacing:0.5px;">
                                            Reset My Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 16px; color:#999; font-size:13px; line-height:1.6;">
                                This link will expire in <strong style="color:#f5deb3;">15 minutes</strong> for security reasons.
                            </p>
                            <p style="margin:0; color:#999; font-size:13px; line-height:1.6;">
                                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 40px; border-top:1px solid #333; text-align:center;">
                            <p style="margin:0; color:#666; font-size:12px;">
                                &copy; ${new Date().getFullYear()} Maximus Trimus. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    try {
        const info = await transporter.sendMail({
            from: fromAddress,
            to,
            subject: 'Reset Your Password — Maximus Trimus',
            html: htmlBody,
        });

        console.log(`✅ Reset email sent to ${to} | Message ID: ${info.messageId}`);
        return info;
    } catch (err) {
        console.error('❌ Failed to send reset email:', err.message || err);
        console.error('❌ Error code:', err.code);
        console.error('❌ SMTP response:', err.response);
        console.error('❌ Email config: HOST=' + process.env.EMAIL_HOST + ', PORT=' + process.env.EMAIL_PORT + ', USER=' + process.env.EMAIL_USER + ', PASS_SET=' + !!process.env.EMAIL_PASS);
        return null;
    }
}

module.exports = { sendResetEmail };
