const bwipjs = require("bwip-js");
const { uploadBufferToCloudinary } = require("./cloudinaryServices");

async function generateAndUploadBarcode(barcodeValue) {
    const buffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: barcodeValue,
        scale: 3,
        height: 15,
        width: 50,
        paddingwidth: 10,
        paddingheight: 10,
        includetext: false,
        textsize: 8,
        textxalign: "center",
        backgroundcolor: "FFFFFF",
    });

    const folder = "app_assets/products/barcodes";
    const publicId = barcodeValue; // use SKU as the public_id

    const cdnUrl = await uploadBufferToCloudinary(buffer, folder, publicId, "image");

    return {
        barcodeValue,
        filePath: `${folder}/${publicId}`,
        cdnUrl
    };
}

module.exports = { generateAndUploadBarcode };
