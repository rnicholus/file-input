/* globals polymerInstance */
describe("file-input custom element tests", function() {
    beforeEach(function() {
        // Doesn't really matter what type of element we use
        // to represent the shadowed file input element.
        // It can't be a real `<input type="file">` since the
        // `files` property is read-only and we will need to mock that out for our tests.
        var fileInputEl = document.createElement("div");

        this.customElementInstance = {
            $: {
                fileInputInput: fileInputEl
            },

            fire: function() {}
        };

        this.fileInputEl = fileInputEl;
    });

    describe("initialization tests", function() {
        it("initializes objects & arrays in the 'created' callbakc", function() {
            polymerInstance.spec.created.call(this.customElementInstance);
            expect(this.customElementInstance.files).toEqual([]);
            expect(this.customElementInstance.invalidFiles).toEqual({count: 0});
        });

        it("doesn't set the multiple attr if maxFiles === 1", function() {
            this.customElementInstance.maxFiles = 1;
            polymerInstance.spec.ready.call(this.customElementInstance);
            expect(this.fileInputEl.hasAttribute("multiple")).toBeFalsy();
        });

        it("does set the multiple attr if maxFiles === 0", function() {
            this.customElementInstance.maxFiles = 0;
            polymerInstance.spec.ready.call(this.customElementInstance);
            expect(this.fileInputEl.hasAttribute("multiple")).toBeTruthy();
        });

        it("does set the multiple attr if maxFiles > 1", function() {
            this.customElementInstance.maxFiles = 2;
            polymerInstance.spec.ready.call(this.customElementInstance);
            expect(this.fileInputEl.hasAttribute("multiple")).toBeTruthy();
        });

        it("enables directory selection only if requested & supported by UA", function() {
            polymerInstance.spec.ready.call(this.customElementInstance);
            expect(this.fileInputEl.hasAttribute("webkitdirectory")).toBeFalsy();

            this.customElementInstance.$.fileInputInput.webkitdirectory = false;
            polymerInstance.spec.ready.call(this.customElementInstance);
            expect(this.fileInputEl.hasAttribute("webkitdirectory")).toBeFalsy();

            this.customElementInstance.directory = true;
            polymerInstance.spec.ready.call(this.customElementInstance);
            expect(this.fileInputEl.hasAttribute("webkitdirectory")).toBeTruthy();
        });
    });

    describe("reset tests", function() {
        it("resets the file arrays on reset", function() {
            polymerInstance.spec.files = [1,2,3];
            polymerInstance.spec.invalidFiles = {count: 1, tooBig: [4]};

            polymerInstance.spec.reset();

            expect(polymerInstance.spec.files).toEqual([]);
            expect(polymerInstance.spec.invalidFiles).toEqual({count: 0});
        });
    });

    describe("validation tests", function() {
         it("doesn't reject any files if no validation rules are present, coverts psuedo-array of files to 'real' Array, & passes this info to event handler as well", function() {
            var expectedValid = [
                    {name: "pic.jpg", size: 1000},
                    {name: "plain.txt", size: 2000}
                ];

            this.customElementInstance.$.fileInputInput.files = {
                "0": expectedValid[0],
                "1": expectedValid[1],
                length: 2
            };

            spyOn(this.customElementInstance, "fire");
            polymerInstance.spec.changeHandler.call(this.customElementInstance);

            expect(this.customElementInstance.fire).toHaveBeenCalledWith("change", {invalid: {count: 0}, valid: expectedValid});
            expect(this.customElementInstance.files).toEqual(expectedValid);
            expect(this.customElementInstance.invalidFiles).toEqual({count: 0});
         });

         it("rejects files that are too big or too small", function() {
            var expectedValid = [
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

            this.customElementInstance.$.fileInputInput.files = [
                    {name: "pic.jpg", size: 1000},
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ];

            this.customElementInstance.maxSize = 2500;
            this.customElementInstance.minSize = 1500;
            polymerInstance.spec.changeHandler.call(this.customElementInstance);

            expect(this.customElementInstance.files).toEqual(expectedValid);
            expect(this.customElementInstance.invalidFiles).toEqual(expectedInvalid);
         });

         it("rejects files with an invalid extension", function() {
            var expectedValid = [
                    {name: "pic.jpg", size: 1000}
                ],
                expectedInvalid = {
                    count: 2,

                    badExtension: [
                        {name: "plain.txt", size: 2000},
                        {name: "foo.bar", size: 3000}
                    ]
                };

            this.customElementInstance.$.fileInputInput.files = [
                    {name: "pic.jpg", size: 1000},
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ];

            /* jshint quotmark:false */
            this.customElementInstance.extensions = '["jpg"]';
            polymerInstance.spec.changeHandler.call(this.customElementInstance);

            expect(this.customElementInstance.files).toEqual(expectedValid);
            expect(this.customElementInstance.invalidFiles).toEqual(expectedInvalid);
         });

         it("rejects files with an invalid extension (negated)", function() {
            var expectedValid = [
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ],
                expectedInvalid = {
                    count: 1,

                    badExtension: [
                        {name: "pic.jpg", size: 1000}
                    ]
                };

            this.customElementInstance.$.fileInputInput.files = [
                    {name: "pic.jpg", size: 1000},
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ];

            /* jshint quotmark:false */
            this.customElementInstance.extensions = '!["jpg"]';
            polymerInstance.spec.changeHandler.call(this.customElementInstance);

            expect(this.customElementInstance.files).toEqual(expectedValid);
            expect(this.customElementInstance.invalidFiles).toEqual(expectedInvalid);
         });

          it("rejects files passed the maxFiles limit", function() {
            var expectedValid = [
                    {name: "pic.jpg", size: 1000}
                ],
                expectedInvalid = {
                    count: 2,

                    tooMany: [
                        {name: "plain.txt", size: 2000},
                        {name: "foo.bar", size: 3000}
                    ]
                };

            this.customElementInstance.$.fileInputInput.files = [
                    {name: "pic.jpg", size: 1000},
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ];

            /* jshint quotmark:false */
            this.customElementInstance.maxFiles = 1;
            polymerInstance.spec.changeHandler.call(this.customElementInstance);

            expect(this.customElementInstance.files).toEqual(expectedValid);
            expect(this.customElementInstance.invalidFiles).toEqual(expectedInvalid);
         });

         it("respects all validation rules at once in the proper order", function() {
            var expectedValid = [
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

            this.customElementInstance.$.fileInputInput.files = [
                    {name: "pic.jpg", size: 1000},
                    {name: "pic2.jpg", size: 1000},
                    {name: "pic3.jpg", size: 1000},
                    {name: "pic4.jpg", size: 1000},
                    {name: "pi5.jpg", size: 9999},
                    {name: "pic6.jpg", size: 1000},
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ];

            /* jshint quotmark:false */
            this.customElementInstance.extensions = '["jpg"]';
            this.customElementInstance.maxFiles = 3;
            this.customElementInstance.maxSize = 8000;
            polymerInstance.spec.changeHandler.call(this.customElementInstance);

            expect(this.customElementInstance.files).toEqual(expectedValid);
            expect(this.customElementInstance.invalidFiles).toEqual(expectedInvalid);
         });
    });
});