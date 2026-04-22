const userModel = require("../models/user.model");
const notificationModel = require("../models/notification.model");

// GET /api/users/:id — Get user profile
async function getUserProfile(req, res) {
    try {
        const user = await userModel.findById(req.params.id)
            .select("-password")
            .populate("followers", "username fullName avatar")
            .populate("following", "username fullName avatar");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// PUT /api/users/edit — Update own profile
async function updateProfile(req, res) {
    try {
        const { username, fullName, bio, avatar, isPrivate } = req.body;

        // If username is being changed, check uniqueness
        if (username !== undefined && username.trim()) {
            const newUsername = username.toLowerCase().trim();
            const existing = await userModel.findOne({
                username: newUsername,
                _id: { $ne: req.user._id }
            });
            if (existing) {
                return res.status(409).json({ message: "Username is already taken" });
            }
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            req.user._id,
            {
                ...(username !== undefined && username.trim() && { username: username.toLowerCase().trim() }),
                ...(fullName !== undefined && { fullName }),
                ...(bio !== undefined && { bio }),
                ...(avatar !== undefined && { avatar }),
                ...(isPrivate !== undefined && { isPrivate })
            },
            { returnDocument: 'after' }
        ).select("-password");

        res.status(200).json({ message: "Profile updated", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// PUT /api/users/avatar — Upload avatar
async function updateAvatar(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image provided" });
        }

        // Store as base64 data URL
        const base64 = req.file.buffer.toString("base64");
        const avatar = `data:${req.file.mimetype};base64,${base64}`;

        const user = await userModel.findByIdAndUpdate(
            req.user._id,
            { avatar },
            { returnDocument: 'after' }
        ).select("-password");

        res.status(200).json({ message: "Avatar updated", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// POST /api/users/:id/follow — Follow/unfollow toggle
async function toggleFollow(req, res) {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user._id;

        if (targetUserId === currentUserId.toString()) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const targetUser = await userModel.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const isFollowing = targetUser.followers.includes(currentUserId);

        if (isFollowing) {
            // Unfollow
            await userModel.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
            await userModel.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });
            res.status(200).json({ message: "Unfollowed successfully", isFollowing: false });
        } else {
            // Follow
            await userModel.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } });
            await userModel.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } });

            // Create notification
            await notificationModel.create({
                recipient: targetUserId,
                sender: currentUserId,
                type: "follow",
                message: `${req.user.username} started following you`
            });

            res.status(200).json({ message: "Followed successfully", isFollowing: true });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// GET /api/users/:id/followers
async function getFollowers(req, res) {
    try {
        const user = await userModel.findById(req.params.id)
            .populate("followers", "username fullName avatar");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ followers: user.followers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// GET /api/users/:id/following
async function getFollowing(req, res) {
    try {
        const user = await userModel.findById(req.params.id)
            .populate("following", "username fullName avatar");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ following: user.following });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// GET /api/users/search?q=
async function searchUsers(req, res) {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const users = await userModel.find({
            $or: [
                { username: { $regex: query, $options: "i" } },
                { fullName: { $regex: query, $options: "i" } }
            ],
            isBanned: false
        })
            .select("username fullName avatar")
            .limit(20);

        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// GET /api/users/suggestions — Suggested users to follow
async function getSuggestions(req, res) {
    try {
        const currentUser = await userModel.findById(req.user._id);

        const suggestions = await userModel.find({
            _id: { $nin: [...currentUser.following, currentUser._id] },
            isBanned: false
        })
            .select("username fullName avatar followers")
            .limit(10)
            .sort({ createdAt: -1 });

        // Add follower count for sorting
        const sorted = suggestions
            .map(u => ({ ...u.toObject(), followersCount: u.followers.length }))
            .sort((a, b) => b.followersCount - a.followersCount);

        res.status(200).json({ users: sorted });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getUserProfile,
    updateProfile,
    updateAvatar,
    toggleFollow,
    getFollowers,
    getFollowing,
    searchUsers,
    getSuggestions
};
