const { generateCaption, generateHashtags } = require("../service/ai.service");

// POST /api/ai/caption
const getAICaption = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: "Prompt is required" });
        }

        const caption = await generateCaption(prompt);
        res.status(200).json({ caption });
    } catch (error) {
        res.status(500).json({ message: "AI service error: " + error.message });
    }
};

// POST /api/ai/hashtags
const getAIHashtags = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: "Prompt is required" });
        }

        const hashtags = await generateHashtags(prompt);
        res.status(200).json({ hashtags });
    } catch (error) {
        res.status(500).json({ message: "AI service error: " + error.message });
    }
};

module.exports = { getAICaption, getAIHashtags };
