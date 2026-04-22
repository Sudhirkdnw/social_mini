const Groq = require("groq-sdk");

let groq = null;

function getGroqClient() {
    if (!groq) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is not set in environment variables");
        }
        groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groq;
}

async function generateCaption(prompt) {
    const client = getGroqClient();
    const completion = await client.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are a creative social media caption writer. Generate engaging, trendy Instagram-style captions. Keep them concise (1-3 sentences). Include relevant emojis."
            },
            {
                role: "user",
                content: `Generate an Instagram caption for: ${prompt}`
            }
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens: 200
    });

    return completion.choices[0]?.message?.content || "";
}

async function generateHashtags(prompt) {
    const client = getGroqClient();
    const completion = await client.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are a social media hashtag expert. Generate 10-15 relevant, trending hashtags. Return only hashtags separated by spaces, no other text."
            },
            {
                role: "user",
                content: `Generate Instagram hashtags for: ${prompt}`
            }
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens: 200
    });

    return completion.choices[0]?.message?.content || "";
}

module.exports = { generateCaption, generateHashtags };
