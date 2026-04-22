const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

async function authMiddleware(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (user.isBanned) {
            return res.status(403).json({ message: "Your account has been banned" });
        }

        // Update last active
        user.lastActive = new Date();
        await user.save();

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token, please login again" });
    }
}

module.exports = authMiddleware;