const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    caption: {type: String, required: true},
    image: {type: String},
    user: {type: mongoose.Schema.Types.ObjectId, ref: "user"}
})

const postModel = mongoose.model("post", postSchema);

module.exports = postModel;