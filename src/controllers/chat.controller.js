const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const User = require("../models/user.model");

async function getConversations(req, res) {
    try {
        const userId = req.user._id;
        const conversations = await Conversation.find({ participants: userId })
            .populate("participants", "username fullName avatar")
            .populate({
                path: "lastMessage",
                populate: { path: "sender", select: "username" }
            })
            .sort({ updatedAt: -1 })
            .lean();

        const conversationsWithUnread = await Promise.all(conversations.map(async (conv) => {
            const unreadCount = await Message.countDocuments({
                conversation: conv._id,
                sender: { $ne: userId },
                readBy: { $ne: userId }
            });
            return { ...conv, unreadCount };
        }));

        res.status(200).json(conversationsWithUnread);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function getOrCreateDM(req, res) {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        if (userId === currentUserId.toString()) {
            return res.status(400).json({ message: "Cannot create DM with yourself" });
        }

        // Check if DM already exists
        let conversation = await Conversation.findOne({
            type: "dm",
            participants: { $all: [currentUserId, userId] }
        }).populate("participants", "username fullName avatar");

        if (!conversation) {
            conversation = await Conversation.create({
                type: "dm",
                participants: [currentUserId, userId]
            });
            conversation = await conversation.populate("participants", "username fullName avatar");
        }

        res.status(200).json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function createGroup(req, res) {
    try {
        const { name, participantIds } = req.body;
        const currentUserId = req.user._id;

        if (!name || !participantIds || participantIds.length === 0) {
            return res.status(400).json({ message: "Group name and participants are required" });
        }

        const participants = [currentUserId, ...participantIds];

        let conversation = await Conversation.create({
            type: "group",
            name,
            admin: currentUserId,
            participants
        });

        conversation = await conversation.populate("participants", "username fullName avatar");

        res.status(201).json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function getMessages(req, res) {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id;

        // Pagination: ?limit=50&cursor=<ISO_timestamp_of_oldest_msg>
        const limit  = Math.min(parseInt(req.query.limit) || 50, 100);
        const cursor = req.query.cursor;

        const conversation = await Conversation.findOne({ _id: id, participants: currentUserId });
        if (!conversation) {
            return res.status(403).json({ message: "Not a participant in this conversation" });
        }

        const filter = { conversation: id };
        if (cursor) filter.createdAt = { $lt: new Date(cursor) };

        const messages = await Message.find(filter)
            .populate("sender", "username avatar")
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json(messages.reverse());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function sendMessage(req, res) {
    try {
        const { id } = req.params; // conversation id
        const { text, tempId } = req.body; // tempId from optimistic UI
        const currentUserId = req.user._id;

        let mediaUrl = undefined;
        let mediaType = undefined;

        if (req.file) {
            const base64 = req.file.buffer.toString("base64");
            mediaUrl = `data:${req.file.mimetype};base64,${base64}`;
            
            if (req.file.mimetype.startsWith("image/")) mediaType = "image";
            else if (req.file.mimetype.startsWith("video/")) mediaType = "video";
            else if (req.file.mimetype.startsWith("audio/")) mediaType = "audio";
        }

        if ((!text || !text.trim()) && !mediaUrl) {
            return res.status(400).json({ message: "Message text or media is required" });
        }

        // Verify participation
        const conversation = await Conversation.findOne({ _id: id, participants: currentUserId });
        if (!conversation) {
            return res.status(403).json({ message: "Not a participant in this conversation" });
        }

        const message = await Message.create({
            conversation: id,
            sender: currentUserId,
            text: text ? text.trim() : "",
            mediaUrl,
            mediaType,
            readBy: [currentUserId]
        });

        await message.populate("sender", "username avatar");

        // Update conversation's lastMessage and timestamp
        conversation.lastMessage = message._id;
        await conversation.save();

        // Emit via Socket.io
        const io = req.app.get("io");
        if (io) {
            // Build the payload — include tempId so the SENDER can match
            // their optimistic message and swap it with the real one.
            const msgPayload = { ...message.toObject(), _tempId: tempId || null };

            // 1. Real-time delivery → conversation room
            io.to(id).emit("receive-message", msgPayload);

            // 2. Lightweight notification → each participant's personal room
            const notifPayload = {
                conversationId: id,
                sender: {
                    _id: message.sender._id,
                    username: message.sender.username,
                    avatar: message.sender.avatar
                },
                text: message.text,
                messageId: message._id.toString()
            };
            conversation.participants.forEach(participantId => {
                const pid = participantId.toString();
                if (pid !== currentUserId.toString()) {
                    io.to(pid).emit("new-message-notification", notifPayload);
                }
            });
        }

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function addGroupMember(req, res) {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const currentUserId = req.user._id;

        const conversation = await Conversation.findOne({ _id: id, type: "group", admin: currentUserId });
        if (!conversation) {
            return res.status(403).json({ message: "Not authorized or conversation is not a group" });
        }

        if (!conversation.participants.includes(userId)) {
            conversation.participants.push(userId);
            await conversation.save();
        }

        res.status(200).json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function removeGroupMember(req, res) {
    try {
        const { id, userId } = req.params;
        const currentUserId = req.user._id;

        const conversation = await Conversation.findOne({ _id: id, type: "group", admin: currentUserId });
        if (!conversation) {
            return res.status(403).json({ message: "Not authorized or conversation is not a group" });
        }

        conversation.participants = conversation.participants.filter(p => p.toString() !== userId);
        await conversation.save();

        res.status(200).json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function deleteMessage(req, res) {
    try {
        const { messageId } = req.params;
        const currentUserId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.sender.toString() !== currentUserId.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this message" });
        }

        const conversationId = message.conversation;
        await message.deleteOne();

        // Check if we need to update lastMessage
        const conversation = await Conversation.findById(conversationId);
        if (conversation && conversation.lastMessage?.toString() === messageId) {
            const lastMsg = await Message.findOne({ conversation: conversationId }).sort({ createdAt: -1 });
            conversation.lastMessage = lastMsg ? lastMsg._id : null;
            await conversation.save();
            
            const io = req.app.get("io");
            if (io) {
                conversation.participants.forEach(participantId => {
                    io.to(participantId.toString()).emit("conversation-updated", conversation);
                });
            }
        }

        const io = req.app.get("io");
        if (io) {
            io.to(conversationId.toString()).emit("message-deleted", { messageId, conversationId });
        }

        res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function deleteConversation(req, res) {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id;

        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // Verify participation
        if (!conversation.participants.includes(currentUserId)) {
            return res.status(403).json({ message: "Not authorized to delete this conversation" });
        }

        await Message.deleteMany({ conversation: id });
        await conversation.deleteOne();

        const io = req.app.get("io");
        if (io) {
            conversation.participants.forEach(participantId => {
                io.to(participantId.toString()).emit("conversation-deleted", { conversationId: id });
            });
        }

        res.status(200).json({ message: "Conversation deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function likeMessage(req, res) {
    try {
        const { messageId } = req.params;
        const currentUserId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const conversation = await Conversation.findById(message.conversation);
        if (!conversation || !conversation.participants.includes(currentUserId)) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const likeIndex = message.likes.indexOf(currentUserId);
        if (likeIndex === -1) {
            message.likes.push(currentUserId);
        } else {
            message.likes.splice(likeIndex, 1);
        }

        await message.save();

        const io = req.app.get("io");
        if (io) {
            io.to(message.conversation.toString()).emit("message-liked", {
                messageId: message._id,
                likes: message.likes
            });
        }

        res.status(200).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function markAsRead(req, res) {
    try {
        const { id } = req.params; // conversation id
        const currentUserId = req.user._id;

        const conversation = await Conversation.findById(id);
        if (!conversation || !conversation.participants.includes(currentUserId)) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await Message.updateMany(
            { conversation: id, readBy: { $ne: currentUserId } },
            { $push: { readBy: currentUserId } }
        );

        const io = req.app.get("io");
        if (io) {
            io.to(id.toString()).emit("conversation-read", {
                conversationId: id,
                userId: currentUserId
            });
        }

        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getConversations,
    getOrCreateDM,
    createGroup,
    getMessages,
    sendMessage,
    addGroupMember,
    removeGroupMember,
    deleteMessage,
    deleteConversation,
    likeMessage,
    markAsRead
};
