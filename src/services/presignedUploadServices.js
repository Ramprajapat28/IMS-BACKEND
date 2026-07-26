const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const uniqid = require("uniqid");
const moment = require("moment-timezone");
const { MIME_TYPES } = require("../routes/middleware/constant");

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
    //     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function generatePresignedUploadUrl({
    fileName,
    functionality,
    subFunctionality
}) {
    let filePath = "";
    let validExtensions = [];


    const fileExtension = fileName.split(".").pop().toLowerCase();


    if (functionality === "app_assets" && subFunctionality === "image") {
        validExtensions = ["jpg", "jpeg", "png", "webp"];
        filePath = "app_assets/image";
    }
    else if (functionality === "product" && subFunctionality === "images") {
        validExtensions = ["jpg", "jpeg", "png", "webp"];
        filePath = "app_assets/products/images";
    }
    else if (functionality === "product" && subFunctionality === "bulk_import") {
        validExtensions = ["csv", "xls", "xlsx"];
        filePath = "app_assets/products/bulk_imports";
    }
    else if (functionality === "user" && subFunctionality === "profile_image") {
        validExtensions = ["jpg", "jpeg", "png", "webp"];
        filePath = "app_assets/users/profile_images";
    }
    else if (functionality === "category" && subFunctionality === "logo") {
    validExtensions = ["jpg", "jpeg", "png", "webp"];
    filePath = "app_assets/categories/logos";
}
    else {
        throw new Error("Invalid functionality or subFunctionality");
    }

    if (!validExtensions.includes(fileExtension)) {
        throw new Error(
            `Invalid file extension. Allowed: ${validExtensions.join(", ")}`
        );
    }


    const contentType = MIME_TYPES[fileExtension];
    if (!contentType) {
        throw new Error("MIME type not found");
    }


    const timestamp =
        moment.tz("Asia/Kolkata").format("YYYY-MM-DD") + "_" + uniqid();

    const safeFileName = fileName
        .replace(/\s+/g, "_")
        .replace(/[^\w.\-]/g, "");

    const finalFilePath = `${filePath}/${timestamp}_${safeFileName}`;


    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: finalFilePath,
        ContentType: contentType
    });


    const presignedUrl = await getSignedUrl(s3, command, {
        expiresIn: 900 // 15 minutes
    });

    return {
        presignedUrl,
        cdnUrl: `${process.env.CDN_BASE_URL}/${finalFilePath}`


    };

}

module.exports = { generatePresignedUploadUrl };
