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

// Configure Cloudinary explicitly
if (process.env.CLOUDINARY_URL) {
    // Some Cloudinary versions require explicit string passing if env vars were loaded late
    cloudinary.config(process.env.CLOUDINARY_URL);
} else if (process.env.CLOUDINARY_CLOUD_NAME) {
    // Fallback: configure from individual vars
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
}

const isConfigured = () =>
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET);

/**
 * Upload a file buffer or base64 string to Cloudinary.
 * 
 * @param {Buffer|string} input  File buffer from multer OR base64 data URL
 * @param {object}        opts   Optional cloudinary upload options
 * @returns {string}             Secure CDN URL of the uploaded image
 */
const uploadImage = async (input, opts = {}, mimetype = null) => {
    if (!isConfigured()) {
        // Cloudinary not configured — fall back to base64 data URL
        if (Buffer.isBuffer(input)) {
            const mime = mimetype || 'image/jpeg';
            return `data:${mime};base64,${input.toString('base64')}`;
        }
        return input; // Already a string (URL or base64)
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
 * @param {Buffer} buffer    File buffer from multer
 * @param {string} mimetype  MIME type from req.file.mimetype
 */
const uploadAvatar = async (buffer, mimetype) => {
    return uploadImage(buffer, {
        folder: 'friendzone/avatars',
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        ],
    }, mimetype);
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
