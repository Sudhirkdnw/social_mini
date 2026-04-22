const userModel = require("../models/user.model");
const otpModel = require("../models/otp.model");
const sendEmail = require("../utils/mailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

async function sendOtpController(req, res) {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        // Check if it's an educational email
        const eduDomains = [".edu", ".ac.in", ".edu.in", ".ac.uk", ".edu.au", ".edu.pk"];
        const isEduEmail = eduDomains.some(d => email.toLowerCase().endsWith(d));
        if (!isEduEmail) {
            return res.status(400).json({ message: "Must be a valid college email (.edu, .ac.in, etc.)" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to DB (overwrites existing if same email due to email uniqueness or we can just delete old)
        await otpModel.deleteMany({ email: email.toLowerCase() });
        await otpModel.create({ email: email.toLowerCase(), otp });

        // Send email
        await sendEmail(
            email.toLowerCase(),
            "Your FriendZone College Verification Code",
            `Hello,\n\nYour college verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nWelcome to FriendZone!`
        );

        res.status(200).json({ message: "OTP sent to email" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function registerController(req, res) {
    try {
        const { username, password, email, fullName, collegeName, collegeEmail } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        if (!collegeName) {
            return res.status(400).json({ message: "College/University name is required" });
        }

        // Must provide either college email or ID card image
        const hasIdCard = req.file;
        if (!collegeEmail && !hasIdCard) {
            return res.status(400).json({ message: "Please provide your college email or upload your college ID card" });
        }

        const userAlreadyExist = await userModel.findOne({
            $or: [
                { username: username.toLowerCase() },
                ...(email ? [{ email: email.toLowerCase() }] : []),
                ...(collegeEmail ? [{ collegeEmail: collegeEmail.toLowerCase() }] : [])
            ]
        });

        if (userAlreadyExist) {
            return res.status(409).json({ message: "User already exists" });
        }

        // Build ID card image if uploaded
        let idCardImage = "";
        if (hasIdCard) {
            const base64 = req.file.buffer.toString("base64");
            idCardImage = `data:${req.file.mimetype};base64,${base64}`;
        }

        // Check if college email is a valid educational domain
        const eduDomains = [".edu", ".ac.in", ".edu.in", ".ac.uk", ".edu.au", ".edu.pk"];
        const isEduEmail = collegeEmail && eduDomains.some(d => collegeEmail.toLowerCase().endsWith(d));

        if (collegeEmail && !isEduEmail) {
            return res.status(400).json({ message: "Must be a valid college email (.edu, .ac.in, etc.)" });
        }

        // If using college email, verify the OTP
        const { otp } = req.body;
        if (collegeEmail) {
            if (!otp) return res.status(400).json({ message: "OTP is required for college email verification" });
            
            const otpRecord = await otpModel.findOne({ email: collegeEmail.toLowerCase() });
            if (!otpRecord) return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
            if (otpRecord.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

            // OTP is valid, delete it
            await otpModel.deleteOne({ _id: otpRecord._id });
        }

        // Auto-verify if valid edu email (since OTP was correct), otherwise pending admin review
        const verificationStatus = isEduEmail ? "verified" : "pending";

        const user = await userModel.create({
            username: username.toLowerCase(),
            password: await bcrypt.hash(password, 10),
            email: email ? email.toLowerCase() : undefined,
            fullName: fullName || "",
            collegeName,
            collegeEmail: collegeEmail ? collegeEmail.toLowerCase() : "",
            idCardImage,
            verificationStatus,
            isVerified: isEduEmail
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "lax"
        });

        res.status(201).json({
            message: isEduEmail
                ? "Account created & verified with college email!"
                : "Account created! Your ID card is pending admin verification.",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                avatar: user.avatar,
                role: user.role,
                verificationStatus: user.verificationStatus,
                collegeName: user.collegeName
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function loginController(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const user = await userModel.findOne({ username: username.toLowerCase() });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isBanned) {
            return res.status(403).json({ message: "Your account has been banned" });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "lax"
        });

        res.status(200).json({
            message: "Login successful",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                avatar: user.avatar,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function logoutController(req, res) {
    res.cookie("token", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
}

async function getMeController(req, res) {
    try {
        const user = await userModel.findById(req.user._id).select("-password");
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    sendOtpController,
    registerController,
    loginController,
    logoutController,
    getMeController
};