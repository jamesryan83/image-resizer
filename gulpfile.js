"use strict";

const gulp = require("gulp");
const path = require("path");

const util = require("../shared-project/azure-dist/util");


// Copies shared files into project
gulp.task("copy-shared-files", async function () {
	await util.copyFolder(path.join(__dirname, "../", "shared-project", "azure-dist"),
		path.join(__dirname, "shared"));
});


// Copy files from server to azure-dist
gulp.task("copy-src-to-azure-dist", function () {
	util.copyFolder(path.join(__dirname, "server"), path.join(__dirname, "azure-dist"));
});
