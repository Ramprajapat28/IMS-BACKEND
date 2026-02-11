const bwipjs = require("bwip-js");
const { uploadToS3 } = require("./s3Services");

async function generateAndUploadBarcode(barcodeValue) {
    const buffer = await bwipjs.toBuffer({
      bcid: "code128",     // barcode type
        text: barcodeValue,           // SKU = barcode value
        scale: 3,          // controls width
        height: 15,        // bar height (mm-ish)
        width:50,        // force total width
        paddingwidth: 10,
        paddingheight: 10,

        includetext: false,
        textsize: 8,
        textxalign: "center",
     
        backgroundcolor: "FFFFFF",
    });

    const filePath = `app_assets/products/barcodes/${barcodeValue}.png`;

    const cdnUrl = await uploadToS3(buffer, filePath, "image/png");

    return {
        barcodeValue,
        filePath,
        cdnUrl
    };
}

module.exports = { generateAndUploadBarcode };
