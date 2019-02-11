"use strict";


const Jimp = require('jimp');
const stream = require('stream');

const azure = require("../shared/azure");
const sharedConfig = require("../shared/config");


module.exports = async (context) => {

    // input properties
    let blobSize = 0;
    let blobName = "";

    // output properties
    let userContainer = "";
    let userFolder = "";
    let imageName = "";
    let fileType = "";
    let imageSizes = [];


    let blobData = context.bindings.inputBlob;


    // validate inputs
    try {
        blobName = context.bindingData.name;
        blobSize = blobData.length;

        if (!blobName) throw new Error("Blob name missing");
        if (!blobSize) throw new Error("Blob is empty");


        // extract parts of filename into properties
        let nameParts = blobName.split(":");
        if (nameParts.length < 5) throw new Error("Invalid file name.  Wrong number of parts");

        userContainer = nameParts[0];
        userFolder = nameParts[1];
        imageName = nameParts[2];
        fileType = nameParts[3];
        nameParts.shift(); // remove properties
        nameParts.shift();
        nameParts.shift();
        nameParts.shift();
        nameParts.pop(); // remove filename
        imageSizes = nameParts;

        if (!userContainer) throw new Error("userContainer missing");
        if (!userFolder) throw new Error("userFolder missing");
        if (!imageName) throw new Error("imageName missing");
        if (!fileType || ["png", "jpg"].indexOf(fileType) === -1) throw new Error("Invalid filetype");
        if (!imageSizes || imageSizes.length === 0) throw new Error("imageSizes missing");

        for (let i = 0; i < imageSizes.length; i++) {
            let size = imageSizes[i];
            if (!size || isNaN(size) || size < 16 || size > 4096) throw new Error("invalid image size: " + imageSizes[i]);
        }


        // Setup azure
        azure.init();

    } catch (ex) {
        return handleError(context, "Error getting file properties", ex);
    }



    // Create compressed images
    try {
        const blobNameBase = userFolder + "/" + imageName;
        const image = await Jimp.read(blobData);


        // jimp uses jpeg
        if (fileType === "jpg") fileType = "jpeg";


        // images need to be resized in decending order
        // TODO: what if the image is small and being enlarged more than once ?
        imageSizes.sort((a, b) => { return b - a });


        // create image
        for (let i = 0; i < imageSizes.length; i++) {
            await createImage(userContainer, image, "image/" + fileType,
                blobNameBase + "-" + imageSizes[i] + "." + fileType, imageSizes[i]);
        }


        // delete original image from source container
        await azure.deleteBlob(sharedConfig.blobStorage.rawImagesContainer, blobName);


        // send message to external server
        await notifyServer();

        logMessage(context, "Completed: " + blobName);

    } catch (ex) {
        return handleError(context, "Error converting image", ex);
    }

};



// create a single blob
function createImage(container, image, mimeType, blobName, size) {
    return new Promise((resolve, reject) => {

        // clone image
        let newImage = image.resize(+size, Jimp.AUTO);

        // image to buffer
        newImage.getBuffer(mimeType, (err1, buffer) => {
            if (err1) return reject(err1);

            const options = { contentSettings: { contentType: mimeType }};

            const readStream = stream.PassThrough();
            readStream.end(buffer);

            // create blob
            azure.blobService.createBlockBlobFromStream(container, blobName, readStream,
                buffer.length, options, (err2, data) => {
                if (err2) return reject(err2);
                return resolve();
            });
        });
    });
}



// Handle an error
async function handleError(context, errMsg, errObj) {
    try {
        if (context.bindingData.name) {
            await azure.deleteBlob(sharedConfig.blobStorage.rawImagesContainer,
                context.bindingData.name);
        } else {
            // TODO: unable to delete input blob at this point
        }
    } catch (ex) {
        if (ex) logMessage(context, ex, true);
    }

    // TODO: error logging service


    // notify external server of an error
    await notifyServer(true);


    logMessage(context, errMsg);
    logMessage(context, errObj, true);
}



// Log a message using the correct function for the environment
function logMessage(context, message, isTestError) {
    if (process.env.NODE_ENV === "dev") {
        console.log(message);
    } else if (process.env.NODE_ENV === "test") {
        if (isTestError) {
            throw message;
        } else {
            console.log(message);
        }
    } else {
        context.log(message);
    }
}



// notify external server of completed conversion
async function notifyServer(isError) {


    // TODO: set this up
}
