/* jshint node:true */
/* globals module */
module.exports = {
    options: {
        autoWatch : false,

        basePath : ".",

        files : [
            "file-input.js",
            "test/unit/*-spec.js"
        ],

        frameworks: ["jasmine"],

        plugins : [
            "karma-coverage",
            "karma-coveralls",
            "karma-firefox-launcher",
            "karma-jasmine",
            "karma-phantomjs-launcher",
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
        browsers: ["PhantomJS"]
    },
    travis: {
        browsers: ["PhantomJS", "Firefox"]
    }
};