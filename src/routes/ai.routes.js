const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");

const { getAICaption, getAIHashtags } = require("../controllers/ai.controller");

router.post("/caption", authMiddleware, getAICaption);
router.post("/hashtags", authMiddleware, getAIHashtags);

module.exports = router;
