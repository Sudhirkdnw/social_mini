const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");

const { getNotifications, markAllRead, getUnreadCount } = require("../controllers/notification.controller");

router.get("/", authMiddleware, getNotifications);
router.put("/read-all", authMiddleware, markAllRead);
router.get("/unread-count", authMiddleware, getUnreadCount);

module.exports = router;
