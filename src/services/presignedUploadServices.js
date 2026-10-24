const { generateUploadSignature } = require("./cloudinaryServices");
const uniqid = require("uniqid");
const moment = require("moment-timezone");
const { MIME_TYPES } = require("../routes/middleware/constant");

/**
 * Generates a signed Cloudinary upload payload for direct frontend uploads.
 * Replaces the old S3 presigned URL approach.
 */
async function generatePresignedUploadUrl({ fileName, functionality, subFunctionality }) {
    let folder = "";
    let validExtensions = [];

    const fileExtension = fileName.split(".").pop().toLowerCase();

    if (functionality === "app_assets" && subFunctionality === "image") {
        validExtensions = ["jpg", "jpeg", "png", "webp"];
        folder = "app_assets/image";
    } else if (functionality === "product" && subFunctionality === "images") {
        validExtensions = ["jpg", "jpeg", "png", "webp"];
        folder = "app_assets/products/images";
    } else if (functionality === "product" && subFunctionality === "bulk_import") {
        validExtensions = ["csv", "xls", "xlsx"];
        folder = "app_assets/products/bulk_imports";
    } else if (functionality === "user" && subFunctionality === "profile_image") {
        validExtensions = ["jpg", "jpeg", "png", "webp"];
        folder = "app_assets/users/profile_images";
    } else if (functionality === "category" && subFunctionality === "logo") {
        validExtensions = ["jpg", "jpeg", "png", "webp"];
        folder = "app_assets/categories/logos";
    } else {
        throw new Error("Invalid functionality or subFunctionality");
    }

    if (!validExtensions.includes(fileExtension)) {
        throw new Error(`Invalid file extension. Allowed: ${validExtensions.join(", ")}`);
    }

    const contentType = MIME_TYPES[fileExtension];
    if (!contentType) throw new Error("MIME type not found");

    const timestamp = moment.tz("Asia/Kolkata").format("YYYY-MM-DD") + "_" + uniqid();
    const safeFileName = fileName.replace(/\s+/g, "_").replace(/[^\w.\-]/g, "").replace(/\.[^.]+$/, ""); // strip extension (Cloudinary handles it)
    const publicId = `${timestamp}_${safeFileName}`;

    return generateUploadSignature(folder, publicId);
}

module.exports = { generatePresignedUploadUrl };
