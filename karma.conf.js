/* jshint node:true */
/* globals module */
module.exports = {
    options: {
        autoWatch : false,

        basePath : ".",

        browserNoActivityTimeout: 300000,

        files : [
            "node_modules/webcomponents.js/webcomponents-lite.js",
            "file-input.js",
            "file-input.html",
            "test/unit/*-spec.js"
        ],

        frameworks: ["jasmine"],

        plugins : [
            "karma-coverage",
            "karma-coveralls",
            "karma-firefox-launcher",
            "karma-jasmine",
            "karma-spec-reporter"
        ],

        preprocessors: {
            "file-input.js": "coverage"
        },

        reporters : [
            "spec",
            "coverage",
            "coveralls"
        ],

        coverageReporter: {
            type: "lcov", // lcov or lcovonly are required for generating lcov.info files
            dir: "coverage/"
        },

        singleRun: true

    },
    dev: {
        browsers: ["Firefox"]
    },
    travis: {
        browsers: ["Firefox"]
    }
};