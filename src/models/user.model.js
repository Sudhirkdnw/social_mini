const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        trim: true,
        default: ""
    },
    bio: {
        type: String,
        maxlength: 150,
        default: ""
    },
    avatar: {
        type: String,
        default: ""
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    isPrivate: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    // College verification fields
    collegeName: {
        type: String,
        trim: true,
        default: ""
    },
    collegeEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: ""
    },
    idCardImage: {
        type: String,
        default: ""
    },
    verificationStatus: {
        type: String,
        enum: ["none", "pending", "verified", "rejected"],
        default: "none"
    },
    rejectionReason: {
        type: String,
        default: ""
    }
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────
// Text search on username and fullName (replaces slow $regex queries)
userSchema.index({ username: 'text', fullName: 'text' });
// Admin: filter by verification status
userSchema.index({ verificationStatus: 1, createdAt: -1 });
// lastActive for online presence queries
userSchema.index({ lastActive: -1 });

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;