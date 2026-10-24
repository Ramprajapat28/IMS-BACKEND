const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder path (e.g. "app_assets/products/barcodes")
 * @param {string} publicId - Unique file name without extension
 * @param {string} resourceType - "image" | "raw" (default: "image")
 * @returns {Promise<string>} - Secure CDN URL
 */
async function uploadBufferToCloudinary(buffer, folder, publicId, resourceType = "image") {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: publicId,
                resource_type: resourceType,
                overwrite: true
            },
            (error, result) => {
                if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
                resolve(result.secure_url);
            }
        );
        uploadStream.end(buffer);
    });
}

/**
 * Generate a signed upload URL for direct frontend uploads (replaces S3 presigned URLs).
 * @param {string} folder - Target Cloudinary folder
 * @param {string} publicId - Target public_id
 * @returns {{ signature, timestamp, cloud_name, api_key, uploadUrl, cdnUrl }}
 */
function generateUploadSignature(folder, publicId) {
    const timestamp = Math.round(Date.now() / 1000);

    const paramsToSign = {
        folder,
        public_id: publicId,
        timestamp
    };

    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET
    );

    const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
    const cdnUrl = cloudinary.url(`${folder}/${publicId}`, { secure: true });

    return {
        signature,
        timestamp,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        folder,
        public_id: publicId,
        uploadUrl,
        cdnUrl
    };
}

module.exports = { uploadBufferToCloudinary, generateUploadSignature };
