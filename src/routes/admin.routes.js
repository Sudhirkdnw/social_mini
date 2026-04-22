const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const {
    getDashboard, getAllUsers, toggleBan, changeRole, deleteUser,
    getAllPosts, toggleHidePost, deleteAnyPost,
    getReports, updateReport, getAnalytics,
    getPendingVerifications, handleVerification
} = require("../controllers/admin.controller");

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

router.get("/dashboard", getDashboard);
router.get("/users", getAllUsers);
router.put("/users/:id/ban", toggleBan);
router.put("/users/:id/role", changeRole);
router.delete("/users/:id", deleteUser);
router.get("/posts", getAllPosts);
router.put("/posts/:id/hide", toggleHidePost);
router.delete("/posts/:id", deleteAnyPost);
router.get("/reports", getReports);
router.put("/reports/:id", updateReport);
router.get("/analytics", getAnalytics);
router.get("/verifications", getPendingVerifications);
router.put("/verifications/:id", handleVerification);

module.exports = router;
