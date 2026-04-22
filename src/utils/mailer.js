const nodemailer = require("nodemailer");

async function sendEmail(to, subject, text) {
    try {
        // Use environment variables if available, otherwise use ethereal test account
        let transporter;

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
        } else {
            // For development, use ethereal if no real email is provided
            // Generate a test account on the fly or just log to console
            console.log("No EMAIL_USER found in .env, using console mock");
            console.log(`\n=== EMAIL MOCK ===\nTo: ${to}\nSubject: ${subject}\nBody:\n${text}\n==================\n`);
            return;
        }

        await transporter.sendMail({
            from: `"FriendZone" <${process.env.EMAIL_USER || "noreply@friendzone.com"}>`,
            to,
            subject,
            text,
        });

        console.log("Email sent to", to);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

module.exports = sendEmail;
