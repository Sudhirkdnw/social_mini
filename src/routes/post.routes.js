const express = require('express');
const authMiddleware = require('../middlewares/authmiddleware');
const router = express.Router();
const {createPost} = require("../controllers/post.controller");

const multer = require('multer');

const upload = multer({storage:multer.memoryStorage()})

router.post('/', 
    authMiddleware, 
    upload.single("image"),
    createPost
);

module.exports = router;