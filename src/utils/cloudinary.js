/**
 * Cloudinary upload utility.
 * 
 * Setup:
 *   1. Create free account: https://cloudinary.com
 *   2. Copy credentials from Dashboard
 *   3. Add to .env:
 *      CLOUDINARY_CLOUD_NAME=your_cloud_name
 *      CLOUDINARY_API_KEY=your_api_key
 *      CLOUDINARY_API_SECRET=your_api_secret
 * 
 * What this does vs base64:
 *   BEFORE: image stored as ~2MB base64 string in MongoDB document
 *   AFTER:  image uploaded to Cloudinary CDN, only the URL stored in MongoDB
 *           → 99% smaller MongoDB documents
 *           → Images served from global CDN edge nodes
 *           → Auto-optimization (WebP, compression, resize on-the-fly)
 */

const cloudinary = require('cloudinary').v2;

// Configure once at module load
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // always https
});

const isConfigured = () =>
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

/**
 * Upload a file buffer or base64 string to Cloudinary.
 * 
 * @param {Buffer|string} input  File buffer from multer OR base64 data URL
 * @param {object}        opts   Optional cloudinary upload options
 * @returns {string}             Secure CDN URL of the uploaded image
 */
const uploadImage = async (input, opts = {}) => {
    if (!isConfigured()) {
        // Cloudinary not configured — fall back to base64 (dev mode)
        if (Buffer.isBuffer(input)) {
            throw new Error('Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env');
        }
        return input; // Return the base64 string as-is if already a string
    }

    const defaults = {
        folder: 'friendzone',
        resource_type: 'auto',
        quality: 'auto:good',      // Auto compress
        fetch_format: 'auto',      // Serve WebP to supported browsers
        transformation: [
            { width: 1200, crop: 'limit' }, // Never upscale, cap at 1200px
        ],
    };

    const uploadOptions = { ...defaults, ...opts };

    // Handle Buffer from multer
    if (Buffer.isBuffer(input)) {
        return await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            });
            stream.end(input);
        });
    }

    // Handle base64 data URL or regular URL string
    const result = await cloudinary.uploader.upload(input, uploadOptions);
    return result.secure_url;
};

/**
 * Upload an avatar — smaller size, circular crop hint.
 */
const uploadAvatar = async (input) => {
    return uploadImage(input, {
        folder: 'friendzone/avatars',
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        ],
    });
};

/**
 * Delete an image from Cloudinary by its public_id.
 * Extract public_id from URL: 'friendzone/posts/abc123'
 */
const deleteImage = async (imageUrl) => {
    if (!isConfigured() || !imageUrl || imageUrl.startsWith('data:')) return;
    try {
        // Extract public_id from CDN URL
        const parts = imageUrl.split('/');
        const filename = parts[parts.length - 1].split('.')[0];
        const folder = parts[parts.length - 2];
        const publicId = `${folder}/${filename}`;
        await cloudinary.uploader.destroy(publicId);
    } catch {
        // Non-critical — don't fail the request
    }
};

module.exports = { uploadImage, uploadAvatar, deleteImage, isConfigured };
