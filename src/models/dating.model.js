const mongoose = require("mongoose");

const datingProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        unique: true
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
        required: true
    },
    interestedIn: {
        type: String,
        enum: ["male", "female", "both"],
        default: "both"
    },
    interests: [{
        type: String,
        trim: true
    }],
    bio: {
        type: String,
        maxlength: 300,
        default: ""
    },
    age: {
        type: Number,
        min: 18,
        max: 30
    },
    photos: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    // Users this profile has swiped right (liked)
    likedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    // Users this profile has swiped left (passed)
    passedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    // Mutual matches
    matches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }]
}, { timestamps: true });

const DatingProfile = mongoose.model("DatingProfile", datingProfileSchema);
module.exports = DatingProfile;
