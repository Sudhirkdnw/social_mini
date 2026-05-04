const DatingProfile = require("../models/dating.model");
const userModel = require("../models/user.model");
const notificationModel = require("../models/notification.model");

// Create or update dating profile
async function setupProfile(req, res) {
    try {
        const { gender, interestedIn, interests, bio, age, photos } = req.body;
        const userId = req.user._id;

        let profile = await DatingProfile.findOne({ user: userId });

        if (profile) {
            // Update existing
            if (gender) profile.gender = gender;
            if (interestedIn) profile.interestedIn = interestedIn;
            if (interests) profile.interests = interests;
            if (bio !== undefined) profile.bio = bio;
            if (age) profile.age = age;
            if (photos) profile.photos = photos;
            await profile.save();
        } else {
            // Create new
            profile = await DatingProfile.create({
                user: userId,
                gender,
                interestedIn: interestedIn || (gender === "male" ? "female" : "male"),
                interests: interests || [],
                bio: bio || "",
                age,
                photos: photos || []
            });
        }

        await profile.populate("user", "username fullName avatar");
        res.status(200).json({ message: "Profile saved", profile });
    } catch (err) {
        console.error("setupProfile error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

// Get my dating profile
async function getMyProfile(req, res) {
    try {
        const profile = await DatingProfile.findOne({ user: req.user._id })
            .populate("user", "username fullName avatar");
        if (!profile) return res.status(404).json({ message: "No dating profile found" });
        res.status(200).json({ profile });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

// Get discovery cards (swipe stack)
async function getDiscovery(req, res) {
    try {
        const userId = req.user._id;
        const myProfile = await DatingProfile.findOne({ user: userId });

        if (!myProfile) {
            return res.status(400).json({ message: "Please set up your dating profile first" });
        }

        // Determine gender filter based on my interestedIn
        let genderFilter = {};
        if (myProfile.interestedIn === "male") genderFilter = { gender: "male" };
        else if (myProfile.interestedIn === "female") genderFilter = { gender: "female" };
        // "both" means no gender filter

        // Exclude: myself, already liked, already passed, already matched
        const excludeIds = [
            userId,
            ...myProfile.likedUsers,
            ...myProfile.passedUsers,
            ...myProfile.matches
        ];

        const candidates = await DatingProfile.find({
            user: { $nin: excludeIds },
            isActive: true,
            ...genderFilter
        })
            .populate("user", "username fullName avatar collegeName verificationStatus")
            .limit(20);

        res.status(200).json({ candidates });
    } catch (err) {
        console.error("getDiscovery error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

// Swipe right (like)
async function swipeRight(req, res) {
    try {
        const userId = req.user._id;
        const { targetUserId } = req.params;

        const myProfile = await DatingProfile.findOne({ user: userId });
        const theirProfile = await DatingProfile.findOne({ user: targetUserId });

        if (!myProfile || !theirProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        // Add to liked
        if (!myProfile.likedUsers.includes(targetUserId)) {
            myProfile.likedUsers.push(targetUserId);
            await myProfile.save();
        }

        // Check if they already liked me back → MATCH!
        let isMatch = false;
        if (theirProfile.likedUsers.includes(userId)) {
            // Create mutual match
            if (!myProfile.matches.includes(targetUserId)) {
                myProfile.matches.push(targetUserId);
                await myProfile.save();
            }
            if (!theirProfile.matches.includes(userId)) {
                theirProfile.matches.push(userId);
                await theirProfile.save();
            }
            isMatch = true;

            // ── Populate the current user for notification message ──
            const meUser = await userModel.findById(userId).select("username fullName avatar");

            // 1️⃣  Save a persistent DB notification for the other user
            await notificationModel.create({
                recipient: targetUserId,
                sender: userId,
                type: "dating_match",
                message: `${meUser.username} is interested in you! You have a new match 💘`
            });

            // 2️⃣  Emit a real-time socket event so they see it instantly
            const io = req.app.get("io");
            if (io) {
                // We need the socket ID of the target user.
                // server.js stores onlineUsers Map on the io object itself.
                const onlineUsers = io._onlineUsers || new Map();
                const targetSocketId = onlineUsers.get(String(targetUserId));
                const payload = {
                    type: "dating_match",
                    sender: {
                        _id: meUser._id,
                        username: meUser.username,
                        fullName: meUser.fullName,
                        avatar: meUser.avatar
                    },
                    message: `${meUser.username} is interested in you! You have a new match 💘`,
                    createdAt: new Date().toISOString()
                };

                if (targetSocketId) {
                    // User is online — send directly
                    io.to(targetSocketId).emit("dating-match", payload);
                } else {
                    // Broadcast anyway (they'll pick it up via notification badge)
                    io.emit(`dating-match-${targetUserId}`, payload);
                }
            }
        }

        res.status(200).json({
            message: isMatch ? "It's a Match! 🎉" : "Liked!",
            isMatch
        });
    } catch (err) {
        console.error("swipeRight error:", err);
        res.status(500).json({ message: "Server error" });
    }
}


// Swipe left (pass)
async function swipeLeft(req, res) {
    try {
        const userId = req.user._id;
        const { targetUserId } = req.params;

        const myProfile = await DatingProfile.findOne({ user: userId });
        if (!myProfile) return res.status(404).json({ message: "Profile not found" });

        if (!myProfile.passedUsers.includes(targetUserId)) {
            myProfile.passedUsers.push(targetUserId);
            await myProfile.save();
        }

        res.status(200).json({ message: "Passed" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

// Get all matches
async function getMatches(req, res) {
    try {
        const userId = req.user._id;
        const myProfile = await DatingProfile.findOne({ user: userId })
            .populate({
                path: "matches",
                select: "username fullName avatar collegeName verificationStatus"
            });

        if (!myProfile) return res.status(200).json({ matches: [] });

        // Get their dating profiles too (for interests)
        const matchDetails = await Promise.all(
            myProfile.matches.map(async (matchUser) => {
                const dp = await DatingProfile.findOne({ user: matchUser._id });
                return {
                    user: matchUser,
                    interests: dp?.interests || [],
                    bio: dp?.bio || "",
                    age: dp?.age
                };
            })
        );

        res.status(200).json({ matches: matchDetails });
    } catch (err) {
        console.error("getMatches error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

// Unmatch
async function unmatch(req, res) {
    try {
        const userId = req.user._id;
        const { targetUserId } = req.params;

        await DatingProfile.updateOne(
            { user: userId },
            { $pull: { matches: targetUserId } }
        );
        await DatingProfile.updateOne(
            { user: targetUserId },
            { $pull: { matches: userId } }
        );

        res.status(200).json({ message: "Unmatched" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    setupProfile,
    getMyProfile,
    getDiscovery,
    swipeRight,
    swipeLeft,
    getMatches,
    unmatch
};
