/* globals CustomEvent */
describe("file-input custom element tests", function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

    var loadFileInput = function() {
            var fileInputEl = document.createElement("file-input");
            document.body.appendChild(fileInputEl);
            return fileInputEl;
        },
        removeFileInput = function() {
            var fileInputEl = document.querySelector("file-input");
            fileInputEl && fileInputEl.parentNode.removeChild(fileInputEl);
        };

    afterEach(function() {
        removeFileInput();
    });

    describe("initialization tests", function() {
        it("initializes objects & arrays in the 'created' callback", function(done) {
            var fileInputEl = loadFileInput();

            window.addEventListener("WebComponentsReady", function(e) {
                expect(fileInputEl.files).toEqual([]);
                expect(fileInputEl.invalid).toEqual({count: 0});
                done();
            });
        });

        it("doesn't set the multiple attr if maxFiles === 1", function() {
            var fileInputEl = loadFileInput();
            fileInputEl.maxFiles = 1;
            expect(fileInputEl.hasAttribute("multiple")).toBeFalsy();
        });

        it("does set the multiple attr if maxFiles === 0", function() {
            var fileInputEl = loadFileInput();
            fileInputEl.maxFiles = 0;
            expect(fileInputEl.querySelector(".fileInput").hasAttribute("multiple")).toBeTruthy();
        });

        it("does set the multiple attr if maxFiles > 1", function() {
            var fileInputEl = loadFileInput();
            fileInputEl.maxFiles = 2;
            expect(fileInputEl.querySelector(".fileInput").hasAttribute("multiple")).toBeTruthy();
        });

        it("enables directory selection only if requested & supported by UA", function() {
            var fileInputEl = loadFileInput();

            // fake file-input into thinking directory selection is supported;
            fileInputEl.querySelector(".fileInput").webkitdirectory = null;

            expect(fileInputEl.querySelector(".fileInput").hasAttribute("webkitdirectory")).toBeFalsy();

            fileInputEl.directory = false;
            expect(fileInputEl.querySelector(".fileInput").hasAttribute("webkitdirectory")).toBeFalsy();

            fileInputEl.directory = true;
            expect(fileInputEl.querySelector(".fileInput").hasAttribute("webkitdirectory")).toBeTruthy();
        });
    });

    describe("reset tests", function() {
        it("resets the file arrays on reset", function() {
            var fileInputEl = loadFileInput();

            fileInputEl.files = [1,2,3];
            fileInputEl.invalid = {count: 1, tooBig: [4]};

            fileInputEl.reset();

            expect(fileInputEl.files).toEqual([]);
            expect(fileInputEl.invalid).toEqual({count: 0});
        });
    });

    describe("validation tests", function() {
        it("doesn't reject any files if no validation rules are present, coverts psuedo-array of files to 'real' Array, & passes this info to event handler as well", function() {
            var fileInputEl = loadFileInput(),
                expectedValid = [
                    {name: "pic.jpg", size: 1000},
                    {name: "plain.txt", size: 2000}
                ];

            spyOn(fileInputEl, "querySelector").and.returnValue({
                files: {
                    "0": expectedValid[0],
                    "1": expectedValid[1],
                    length: 2
                }
            });

            spyOn(fileInputEl, "dispatchEvent");
            fileInputEl.changeHandler.call(fileInputEl, {stopPropagation: function(){}});
            expect(fileInputEl.dispatchEvent).toHaveBeenCalledWith(new CustomEvent("change", { detail : {count: 0}, valid: expectedValid}));
            expect(fileInputEl.files).toEqual(expectedValid);
            expect(fileInputEl.invalid).toEqual({count: 0});
        });

        it("ignores native change event if no files were selected", function() {
            var fileInputEl = loadFileInput();

            fileInputEl.files = [1, 2];

            spyOn(fileInputEl, "querySelector").and.returnValue({
                files: {
                    length: 0
                }
            });

            spyOn(fileInputEl, "dispatchEvent");
            fileInputEl.changeHandler.call(fileInputEl, {stopPropagation: function(){}});

            expect(fileInputEl.dispatchEvent).not.toHaveBeenCalled();
            expect(fileInputEl.files).toEqual([1, 2]);
        });

        it("rejects files that are too big or too small", function() {
            var fileInputEl = loadFileInput(),
                expectedValid = [
                    {name: "plain.txt", size: 2000}
                ],
                expectedInvalid = {
                    count: 2,

                    tooBig: [
                        {name: "foo.bar", size: 3000}
                    ],

                    tooSmall: [
                        {name: "pic.jpg", size: 1000}
                    ]
                };

            spyOn(fileInputEl, "querySelector").and.returnValue({
                files: [
                    {name: "pic.jpg", size: 1000},
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ]
            });

            fileInputEl.maxSize = 2500;
            fileInputEl.minSize = 1500;
            fileInputEl.changeHandler.call(fileInputEl, {stopPropagation: function(){}});

            expect(fileInputEl.files).toEqual(expectedValid);
            expect(fileInputEl.invalid).toEqual(expectedInvalid);
        });

        it("rejects files with an invalid extension", function() {
            var fileInputEl = loadFileInput(),
                expectedValid = [
                    {name: "pic.jpg", size: 1000}
                ],
                expectedInvalid = {
                    count: 2,

                    badExtension: [
                        {name: "plain.txt", size: 2000},
                        {name: "foo.bar", size: 3000}
                    ]
                };

            spyOn(fileInputEl, "querySelector").and.returnValue({
                files: [
                    {name: "pic.jpg", size: 1000},
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ]
            });

            /* jshint quotmark:false */
            fileInputEl.extensions = '["jpg"]';
            fileInputEl.changeHandler.call(fileInputEl, {stopPropagation: function(){}});

            expect(fileInputEl.files).toEqual(expectedValid);
            expect(fileInputEl.invalid).toEqual(expectedInvalid);
        });

        it("rejects files with an invalid extension (negated)", function() {
            var fileInputEl = loadFileInput(),
                expectedValid = [
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ],
                expectedInvalid = {
                    count: 1,

                    badExtension: [
                        {name: "pic.jpg", size: 1000}
                    ]
                };

            spyOn(fileInputEl, "querySelector").and.returnValue({
                files: [
                    {name: "pic.jpg", size: 1000},
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ]
            });

            /* jshint quotmark:false */
            fileInputEl.extensions = '!["jpg"]';
            fileInputEl.changeHandler.call(fileInputEl, {stopPropagation: function(){}});

            expect(fileInputEl.files).toEqual(expectedValid);
            expect(fileInputEl.invalid).toEqual(expectedInvalid);
        });

        it("rejects files passed the maxFiles limit", function() {
            var fileInputEl = loadFileInput(),
                expectedValid = [
                    {name: "pic.jpg", size: 1000}
                ],
                expectedInvalid = {
                    count: 2,

                    tooMany: [
                        {name: "plain.txt", size: 2000},
                        {name: "foo.bar", size: 3000}
                    ]
                };

            spyOn(fileInputEl, "querySelector").and.returnValue({
                files: [
                    {name: "pic.jpg", size: 1000},
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ],
                removeAttribute: function() {}
            });

            /* jshint quotmark:false */
            fileInputEl.maxFiles = 1;
            fileInputEl.changeHandler.call(fileInputEl, {stopPropagation: function(){}});

            expect(fileInputEl.files).toEqual(expectedValid);
            expect(fileInputEl.invalid).toEqual(expectedInvalid);
        });

        it("respects all validation rules at once in the proper order", function() {
            var fileInputEl = loadFileInput(),
                expectedValid = [
                    {name: "pic.jpg", size: 1000},
                    {name: "pic2.jpg", size: 1000},
                    {name: "pic3.jpg", size: 1000},
                ],
                expectedInvalid = {
                    count: 5,

                    badExtension: [
                        {name: "plain.txt", size: 2000},
                        {name: "foo.bar", size: 3000}
                    ],

                    tooBig: [
                        {name: "pi5.jpg", size: 9999},
                    ],

                    tooMany: [
                        {name: "pic4.jpg", size: 1000},
                        {name: "pic6.jpg", size: 1000},
                    ]
                };

            spyOn(fileInputEl, "querySelector").and.returnValue({
                files: [
                    {name: "pic.jpg", size: 1000},
                    {name: "pic2.jpg", size: 1000},
                    {name: "pic3.jpg", size: 1000},
                    {name: "pic4.jpg", size: 1000},
                    {name: "pi5.jpg", size: 9999},
                    {name: "pic6.jpg", size: 1000},
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ],
                setAttribute: function() {}
            });

            /* jshint quotmark:false */
            fileInputEl.extensions = '["jpg"]';
            fileInputEl.maxFiles = 3;
            fileInputEl.maxSize = 8000;
            fileInputEl.changeHandler.call(fileInputEl, {stopPropagation: function(){}});

            expect(fileInputEl.files).toEqual(expectedValid);
            expect(fileInputEl.invalid).toEqual(expectedInvalid);
        });

        it("marks the element as invalid on load if `required` attribute exists", function(done) {
            var fileInputElParent = document.createElement("div"),
                delegateInputEl;

            spyOn(fileInputElParent, "insertBefore").and.callFake(function(delegateInput) {
                delegateInputEl = delegateInput;

                expect(delegateInput.tagName.toLowerCase()).toEqual("input");
                expect(delegateInput.validity.valid).toBe(true);
                expect(delegateInputEl.customElementRef).toEqual(fileInputElParent.children[0]);
                window.setTimeout(function() {
                    expect(delegateInput.validity.valid).toBe(false);
                    done();
                }, 100);
            });

            fileInputElParent.insertAdjacentHTML("afterbegin", "<file-input required></file-input>");
            document.body.appendChild(fileInputElParent);
        });

        it("marks the element as valid on load if `required` attribute exists once it is truly valid", function(done) {
            var fileInputElParent = document.createElement("div"),
                delegateInputEl;

            spyOn(fileInputElParent, "insertBefore").and.callFake(function(delegateInput) {
                delegateInputEl = delegateInput;

                fileInputElParent.children[0].files = [
                    {name: "pic.jpg", size: 1000}
                ];
                window.setTimeout(function() {
                    expect(delegateInput.validity.valid).toBe(true);
                    done();
                }, 100);
            });

            fileInputElParent.insertAdjacentHTML("afterbegin", "<file-input required></file-input>");
            document.body.appendChild(fileInputElParent);
        });
    });
});