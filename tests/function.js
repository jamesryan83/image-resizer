"use strict";

// IMPORTANT
// The input container must exist before running this
// as the blob storage binding to the container won't work if the
// container is created after starting the azure function host.

// There is a timeout for all tests set in test-start.js


const fs = require("fs");
const path = require("path");
const assert = require("assert");

const azure = require("../shared/azure");
const sharedConfig = require("../shared/config");
const azureFunction = require("../src/index");

const blobConfig = sharedConfig.blobStorage;
const fixtures = path.join(__dirname, "fixtures");

const testUserContainer = "12345678";
const testImageName = testUserContainer + ":user:avatar:png:32:128:something.jpg"


describe("FUNCTION", function () {


    before(async function () {
        azure.init();

        try {
            await azure.createContainer(blobConfig.rawImagesContainer);
            await azure.createContainer(testUserContainer);
            await deleteRawImageBlobs();
        } catch (ex) {
            throw ex;
        }
    });


    after(async function () {
        try {
            await azure.deleteContainer(testUserContainer);
            await deleteRawImageBlobs();
        } catch (ex) {
            throw ex;
        }
    });



    it("#function returns error when blob name is missing", async function () {
        let context = getTestFunctionContext(testImageName, null, "dog.png");
        context.bindingData.name = "";
        await testFunctionPropertyError(context, "Blob name missing");
    });


    it("#function returns error when blob data is missing", async function () {
        let context = getTestFunctionContext(testImageName, null);
        await testFunctionPropertyError(context, "Blob is empty");
    });




    it("#function returns error when userContainer is missing", async function () {
        let context = getTestFunctionContext(":user:avatar:png:32:something.png", null, "dog.png");
        await testFunctionPropertyError(context, "userContainer missing");
    });


    it("#function returns error when userFolder is missing", async function () {
        let context = getTestFunctionContext("12345678::avatar:png:32:something.png", null, "dog.png");
        await testFunctionPropertyError(context, "userFolder missing");
    });


    it("#function returns error when imageName is missing", async function () {
        let context = getTestFunctionContext("12345678:user::png:32:something.png", null, "dog.png");
        await testFunctionPropertyError(context, "imageName missing");
    });


    it("#function returns error when fileType is missing", async function () {
        let context = getTestFunctionContext("12345678:user:avatar::32:something.png", null, "dog.png");
        await testFunctionPropertyError(context, "Invalid filetype");
    });


    it("#function returns error when fileType is invalid", async function () {
        let context = getTestFunctionContext("12345678:user:avatar:abc:32:something.png", null, "dog.png");
        await testFunctionPropertyError(context, "Invalid filetype");

        context = getTestFunctionContext("12345678:user:avatar:123:32:something.png", null, "dog.png");
        await testFunctionPropertyError(context, "Invalid filetype");
    });


    // it("#function returns error when imageSizes are missing", async function () {
        // hard to test because it's always there because its a string
    // });


    it("#function returns error when imageSizes is invalid", async function () {
        let context = getTestFunctionContext("12345678:user:avatar:png:2:something.png", null, "dog.png");
        await testFunctionPropertyError(context, "invalid image size");

        context = getTestFunctionContext("12345678:user:avatar:png:50000:something.png", null, "dog.png");
        await testFunctionPropertyError(context, "invalid image size");

        context = getTestFunctionContext("12345678:user:avatar:png::something.png", null, "dog.png");
        await testFunctionPropertyError(context, "invalid image size");

        context = getTestFunctionContext("12345678:user:avatar:png:0:something.png", null, "dog.png");
        await testFunctionPropertyError(context, "invalid image size");

        context = getTestFunctionContext("12345678:user:avatar:png:abc:something.png", null, "dog.png");
        await testFunctionPropertyError(context, "invalid image size");
    });






    it("#test azure function works", async function () {
        let blobName = testUserContainer + ":user:avatar:png:32:dog.png";
        let context = getTestFunctionContext(blobName, null, "dog.png");

        // call function with mock context
        await azureFunction(context);

        // check output blobs were created
        let blobs = await azure.getBlobs(testUserContainer);
        assert.equal(blobs.length, 1);

        // TODO: can't do this without creating blob in azure first
        // check input blob was deleted
        // let blobs = await azure.getBlobs(blobConfig.rawImagesContainer);
        // console.log(blobs);
    });


    it("#test azure function works with big picture and overwrites original images", async function () {
        let blobName = testUserContainer + ":user:avatar:png:32:doesnotmatterifthisisdifferentfromthefilename.png";
        let context = getTestFunctionContext(blobName, null, "big-pic.jpg");

        // call function with mock context
        await azureFunction(context);

        // check output blobs were created
        let blobs = await azure.getBlobs(testUserContainer);
        assert.equal(blobs.length, 1);
    });


    it("#test azure function works and adds new image", async function () {
        let blobName = testUserContainer + ":user:otherpic:jpg:32:dog.png";
        let context = getTestFunctionContext(blobName, null, "dog.png");

        // call function with mock context
        await azureFunction(context);

        // check output blobs were created
        let blobs = await azure.getBlobs(testUserContainer);
        assert.equal(blobs.length, 2);
    });


    it("#test azure function works and adds new images with multiple sizes", async function () {
        let blobName = testUserContainer + ":user:bigpic:jpg:128:512:1024:4096:big-pic.jpg";
        let context = getTestFunctionContext(blobName, null, "big-pic.jpg");

        // call function with mock context
        await azureFunction(context);

        // check output blobs were created
        let blobs = await azure.getBlobs(testUserContainer);
        assert.equal(blobs.length, 6);
    });


});




// Deletes all the images from the test raw images container
async function deleteRawImageBlobs() {
    let blobs = await azure.getBlobs(blobConfig.rawImagesContainer);
    blobs.forEach(async b => await azure.deleteBlob(blobConfig.rawImagesContainer, b.name));
}




// Returns an azure function context for testing
function getTestFunctionContext(fileName, contentType, blobPath) {
    // Returns an object that is the same as the azure function host context object but with the file data missing
    let context = JSON.parse(fs.readFileSync(path.join(fixtures, "test-context.json"), "utf-8"));

    // update filename
    context.bindingData.blobTrigger = sharedConfig.blobStorage.rawImagesContainer + "/" + fileName;
    context.bindingData.name = fileName;

    // update content-type and data
    if (blobPath) {
        let buffer = fs.readFileSync(path.join(fixtures, blobPath));
        if (contentType) context.bindingData.properties.contentType = contentType;
        context.bindings.inputBlob = buffer;
    }

    return context;
}




// Test and error with the properties
async function testFunctionPropertyError(context, message) {
    try {
        await azureFunction(context);
    } catch (ex) {
        console.log(ex.message, message);
        assert(ex.message.indexOf(message) !== -1);
    }
}
