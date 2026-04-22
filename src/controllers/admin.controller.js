const userModel = require("../models/user.model");
const postModel = require("../models/post.model");
const reportModel = require("../models/report.model");

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
    try {
        const [totalUsers, totalPosts, totalReports, bannedUsers, pendingVerifications] = await Promise.all([
            userModel.countDocuments(),
            postModel.countDocuments(),
            reportModel.countDocuments({ status: "pending" }),
            userModel.countDocuments({ isBanned: true }),
            userModel.countDocuments({ verificationStatus: "pending" })
        ]);

        const recentUsers = await userModel.find().sort({ createdAt: -1 }).limit(5).select("username fullName avatar createdAt");
        const recentPosts = await postModel.find().sort({ createdAt: -1 }).limit(5).populate("user", "username avatar");

        res.status(200).json({
            stats: { totalUsers, totalPosts, pendingReports: totalReports, bannedUsers, pendingVerifications },
            recentUsers,
            recentPosts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";

        const filter = search
            ? { $or: [{ username: { $regex: search, $options: "i" } }, { fullName: { $regex: search, $options: "i" } }] }
            : {};

        const users = await userModel.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await userModel.countDocuments(filter);

        res.status(200).json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/admin/users/:id/ban
const toggleBan = async (req, res) => {
    try {
        const user = await userModel.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.isBanned = !user.isBanned;
        await user.save();

        res.status(200).json({ message: user.isBanned ? "User banned" : "User unbanned", isBanned: user.isBanned });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/admin/users/:id/role
const changeRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const user = await userModel.findByIdAndUpdate(req.params.id, { role }, { returnDocument: 'after' }).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ message: "Role updated", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
    try {
        const user = await userModel.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Also delete their posts
        await postModel.deleteMany({ user: req.params.id });

        res.status(200).json({ message: "User and their posts deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/posts
const getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const posts = await postModel.find().populate("user", "username avatar").sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await postModel.countDocuments();

        res.status(200).json({ posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/admin/posts/:id/hide
const toggleHidePost = async (req, res) => {
    try {
        const post = await postModel.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        post.isHidden = !post.isHidden;
        await post.save();

        res.status(200).json({ message: post.isHidden ? "Post hidden" : "Post visible", isHidden: post.isHidden });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/admin/posts/:id
const deleteAnyPost = async (req, res) => {
    try {
        const post = await postModel.findByIdAndDelete(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        res.status(200).json({ message: "Post deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/reports
const getReports = async (req, res) => {
    try {
        const status = req.query.status || "pending";
        const reports = await reportModel.find({ status })
            .populate("reporter", "username avatar")
            .populate("reportedUser", "username avatar")
            .populate("reportedPost", "caption image")
            .sort({ createdAt: -1 });

        res.status(200).json({ reports });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/admin/reports/:id
const updateReport = async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        const report = await reportModel.findByIdAndUpdate(
            req.params.id,
            { status, adminNote },
            { returnDocument: 'after' }
        );
        if (!report) return res.status(404).json({ message: "Report not found" });

        res.status(200).json({ message: "Report updated", report });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [userGrowth, postActivity] = await Promise.all([
            userModel.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            postModel.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ])
        ]);

        res.status(200).json({ userGrowth, postActivity });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/verifications — Get users pending college verification
const getPendingVerifications = async (req, res) => {
    try {
        const users = await userModel.find({ verificationStatus: "pending" })
            .select("username fullName collegeName collegeEmail idCardImage verificationStatus createdAt")
            .sort({ createdAt: 1 });

        res.status(200).json({ users, total: users.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/admin/verifications/:id — Approve or reject a user's verification
const handleVerification = async (req, res) => {
    try {
        const { action, reason } = req.body; // action: "approve" | "reject"

        if (!["approve", "reject"].includes(action)) {
            return res.status(400).json({ message: "Action must be 'approve' or 'reject'" });
        }

        const user = await userModel.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (action === "approve") {
            user.verificationStatus = "verified";
            user.isVerified = true;
            user.rejectionReason = "";
        } else {
            user.verificationStatus = "rejected";
            user.isVerified = false;
            user.rejectionReason = reason || "Your ID card could not be verified. Please upload a clearer image.";
        }

        await user.save();

        res.status(200).json({
            message: action === "approve" ? "User verified successfully" : "Verification rejected",
            user: { _id: user._id, username: user.username, verificationStatus: user.verificationStatus }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboard, getAllUsers, toggleBan, changeRole, deleteUser,
    getAllPosts, toggleHidePost, deleteAnyPost,
    getReports, updateReport, getAnalytics,
    getPendingVerifications, handleVerification
};
