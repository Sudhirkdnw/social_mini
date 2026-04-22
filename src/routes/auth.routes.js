const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { sendOtpController, registerController, loginController, logoutController, getMeController } = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/authmiddleware");

router.post("/send-otp", sendOtpController);
router.post("/register", upload.single("idCardImage"), registerController);
router.post("/login", loginController);
router.post("/logout", logoutController);
router.get("/me", authMiddleware, getMeController);

module.exports = router;