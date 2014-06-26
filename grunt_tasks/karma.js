/* jshint node:true */
/* globals module */
module.exports = {
    options: {
        autoWatch : false,

        basePath : ".",

        files : [
            "test/unit/polymer-mock.js",
            "element/*.js",
            "test/unit/*-spec.js"
        ],

        frameworks: ["jasmine"],

        plugins : [
            "karma-coverage",
            "karma-coveralls",
            "karma-jasmine",
            "karma-phantomjs-launcher"
        ],

        preprocessors: {
            "element/*.js": "coverage"
        },

        reporters : [
            "dots",
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
    server: {
        hostname: "outrun-altoun.codio.io",
        singleRun: false
    },
    travis: {
        browsers: ["PhantomJS"]
    }
};