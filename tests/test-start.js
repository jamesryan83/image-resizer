"use strict";

// Run tests
// https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically
// https://stackoverflow.com/questions/18660916/how-can-i-subscribe-to-mocha-suite-events


var path = require("path");
var Mocha = require("mocha");

var mocha = new Mocha({ bail: true, timeout: 60000 });

mocha.addFile(path.join(__dirname, "function.js"));

// Run the tests
mocha.run(function (failures) {
    process.on("exit", function () {
        process.exit(failures);
    });

    process.exit(0);
});
