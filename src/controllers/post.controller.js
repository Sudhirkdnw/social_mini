const express = require('express');
const postModel = require('../models/post.model');

const createPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const image = req.file ? req.file.buffer : null;

        const post = await postModel.create({
            caption,
            image,
            user: res.user._id
        });

        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createPost };