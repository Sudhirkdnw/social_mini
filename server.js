const app = require('./src/app');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./src/db/db');
const http = require('http');
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { redisClient, redisSubscriber, redisReady } = require('./src/utils/redis');

connectDB();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            const clientUrl = process.env.CLIENT_URL;
            if (!origin) return callback(null, true);
            if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
                return callback(null, true);
            }
            if (clientUrl && origin === clientUrl) {
                return callback(null, true);
            }
            callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.set("io", io);

const onlineUsers = new Map();
io._onlineUsers = onlineUsers;

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("setup", (userId) => {
        const uid = String(userId);
        socket.join(uid);
        onlineUsers.set(uid, socket.id);
        socket.userId = uid;
        io.emit("online-users", Array.from(onlineUsers.keys()));
        console.log("Online users:", Array.from(onlineUsers.keys()));
    });

    socket.on("join-conversation", (conversationId) => {
        socket.join(conversationId);
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on("leave-conversation", (conversationId) => {
        socket.leave(conversationId);
    });

    socket.on("typing", ({ conversationId, username }) => {
        socket.to(conversationId).emit("user-typing", { conversationId, username });
    });

    socket.on("stop-typing", ({ conversationId, username }) => {
        socket.to(conversationId).emit("user-stopped-typing", { conversationId, username });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        if (socket.userId) {
            onlineUsers.delete(socket.userId);
            io.emit("online-users", Array.from(onlineUsers.keys()));
        }
    });
});

// ── Start server after Redis is ready ────────────────────────────────────────
// Attaching the Redis adapter BEFORE the connection is established causes:
// "Stream isn't writeable and enableOfflineQueue options is false"
// Solution: await redisReady, THEN attach adapter, THEN start listening.
const startServer = async () => {
    if (redisClient && redisSubscriber) {
        try {
            await redisReady; // Wait for both pub + sub connections to be ready
            io.adapter(createAdapter(redisClient, redisSubscriber));
            console.log('✅ Socket.IO using Redis adapter (cluster-ready)');
        } catch (err) {
            console.warn('⚠️  Redis adapter failed, falling back to in-memory:', err.message);
        }
    } else {
        console.log('ℹ️  Socket.IO using in-memory adapter (single-process only)');
    }

    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();