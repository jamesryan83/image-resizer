
# Image resizing service



## Overview

This runs as an Azure function and uses blob storage

It detects files uploaded to the an input blob container and converts them to compressed images, uploads the compressed images to the output container and then deletes the original image

The upload image filename needs to be in this format

`outputContainer:outputFolder:imageName:fileType:size1:size2:sizeN:originalFilename.ext`

then the output images are saved as

`outputContainer/outputFolder/imageName-dimensions.fileType`

for example

`mycontainer:images:user-picture:jpg:64:128:1024:someimage.png`

creates 3 output images

`mycontainer/images/user-picture-64.jpg`

`mycontainer/images/user-picture-128.jpg`

`mycontainer/images/user-picture-1024.jpg`





## Installation

1. Install gulp globally `npm i -g gulp`

2. Install functions-core-tools globally `npm install -g azure-functions-core-tools@2`

3. Install .NET Core SDK https://dotnet.microsoft.com/download (restart VSCode after install)

4. Install the storage emulator and explorer (see below)





### Azure storage emulator and storage explorer

The azure storage emulator needs to be running for the storage explorer to work on localhost.

There is a standalone installer for the azure storage emulator here

https://docs.microsoft.com/en-us/azure/storage/common/storage-use-emulator

The azure storage explorer is used to browse the storage data (blob and table storage) either in the emulator or on azure

https://azure.microsoft.com/en-us/features/storage-explorer/





## Development

Run `npm run dev` to start the azure functions host.

Upload an image to blob storage with the correctly formatted file name and it should be converted and uploaded to another container specified by the containerName in the filename of the uploaded image.  The container specifed by outputContainer is expected to exist already.  The filename at the end of the input filepath doesn't have to match the actual filename.

Use `context.log(msg)` instead of `console.log(msg)` on Azure.  Azure will only print `context.log` messages.






## Scripts

These can be run in a console in the base folder of the project:


`npm run dev`

Runs the function host.  While this is running files can be uploaded to the Azure Storage Explorer

`npm run test`

Rus the tests.  The function host doesn't need to be running but the storage emulator does.

`npm run copy:shared-files`

copy shared files from the shared project into /shared





## Tests

The function host doesn't need to be running to run the tests

`npm run test`




## TODO




## Other stuff

https://azure.microsoft.com/en-au/resources/samples/storage-blob-resize-function-node/

https://www.npmjs.com/package/jimp

https://docs.microsoft.com/en-us/azure/azure-functions/functions-host-json

https://docs.microsoft.com/en-us/azure/azure-functions/functions-triggers-bindings#binding-expressions---app-settings


NOTE: this is just a demo, the code in the shared folder is private
