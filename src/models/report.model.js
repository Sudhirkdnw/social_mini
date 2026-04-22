const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    reportedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post"
    },
    reason: {
        type: String,
        required: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ["pending", "reviewed", "resolved"],
        default: "pending"
    },
    adminNote: {
        type: String,
        default: ""
    }
}, { timestamps: true });

const reportModel = mongoose.model("report", reportSchema);

module.exports = reportModel;
