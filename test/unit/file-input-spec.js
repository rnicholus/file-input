/* globals fileInput */
describe("file-input custom element tests", function() {
    beforeEach(function() {
        // Doesn't really matter what type of element we use
        // to represent the shadowed file input element.
        // It can't be a real `<input type="file">` since the
        // `files` property is read-only and we will need to mock that out for our tests.
        var fileInputEl = document.createElement("div");

        this.customElementInstance = {
            $: {
                fileInput: fileInputEl
            },

            fire: function() {},

            invalidText: "not valid!"
        };

        this.fileInputEl = fileInputEl;
    });

    describe("initialization tests", function() {
        it("initializes objects & arrays in the 'created' callba", function() {
            fileInput.created.call(this.customElementInstance);
            expect(this.customElementInstance.files).toEqual([]);
            expect(this.customElementInstance.invalid).toEqual({count: 0});
        });

        it("doesn't set the multiple attr if maxFiles === 1", function() {
            this.customElementInstance.maxFiles = 1;
            fileInput.domReady.call(this.customElementInstance);
            expect(this.fileInputEl.hasAttribute("multiple")).toBeFalsy();
        });

        it("does set the multiple attr if maxFiles === 0", function() {
            this.customElementInstance.maxFiles = 0;
            fileInput.domReady.call(this.customElementInstance);
            expect(this.fileInputEl.hasAttribute("multiple")).toBeTruthy();
        });

        it("does set the multiple attr if maxFiles > 1", function() {
            this.customElementInstance.maxFiles = 2;
            fileInput.domReady.call(this.customElementInstance);
            expect(this.fileInputEl.hasAttribute("multiple")).toBeTruthy();
        });

        it("enables directory selection only if requested & supported by UA", function() {
            fileInput.domReady.call(this.customElementInstance);
            expect(this.fileInputEl.hasAttribute("webkitdirectory")).toBeFalsy();

            this.customElementInstance.$.fileInput.webkitdirectory = false;
            fileInput.domReady.call(this.customElementInstance);
            expect(this.fileInputEl.hasAttribute("webkitdirectory")).toBeFalsy();

            this.customElementInstance.directory = true;
            fileInput.domReady.call(this.customElementInstance);
            expect(this.fileInputEl.hasAttribute("webkitdirectory")).toBeTruthy();
        });
    });

    describe("reset tests", function() {
        it("resets the file arrays on reset", function() {
            fileInput.files = [1,2,3];
            fileInput.invalid = {count: 1, tooBig: [4]};

            var div = document.createElement("div");
            div.appendChild(this.customElementInstance.$.fileInput);

            this.customElementInstance.created = function() {
                fileInput.created.call(fileInput);
            };

            fileInput.reset.call(this.customElementInstance);

            expect(fileInput.files).toEqual([]);
            expect(fileInput.invalid).toEqual({count: 0});
        });
    });

    describe("validation tests", function() {
         it("doesn't reject any files if no validation rules are present, coverts psuedo-array of files to 'real' Array, & passes this info to event handler as well", function() {
            var expectedValid = [
                    {name: "pic.jpg", size: 1000},
                    {name: "plain.txt", size: 2000}
                ];

            this.customElementInstance.$.fileInput.files = {
                "0": expectedValid[0],
                "1": expectedValid[1],
                length: 2
            };

            spyOn(this.customElementInstance, "fire");
            fileInput.changeHandler.call(this.customElementInstance);

            expect(this.customElementInstance.fire).toHaveBeenCalledWith("change", {invalid: {count: 0}, valid: expectedValid});
            expect(this.customElementInstance.files).toEqual(expectedValid);
            expect(this.customElementInstance.invalid).toEqual({count: 0});
         });

         it("ignores native change event if no files were selected", function() {
            this.customElementInstance.files = [1, 2];

            this.customElementInstance.$.fileInput.files = {length: 0};

            spyOn(this.customElementInstance, "fire");
            fileInput.changeHandler.call(this.customElementInstance);

            expect(this.customElementInstance.fire).not.toHaveBeenCalled();
            expect(this.customElementInstance.files).toEqual([1, 2]);
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

            this.customElementInstance.$.fileInput.files = [
                    {name: "pic.jpg", size: 1000},
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ];

            this.customElementInstance.maxSize = 2500;
            this.customElementInstance.minSize = 1500;
            fileInput.changeHandler.call(this.customElementInstance);

            expect(this.customElementInstance.files).toEqual(expectedValid);
            expect(this.customElementInstance.invalid).toEqual(expectedInvalid);
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

            this.customElementInstance.$.fileInput.files = [
                    {name: "pic.jpg", size: 1000},
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ];

            /* jshint quotmark:false */
            this.customElementInstance.extensions = '["jpg"]';
            fileInput.changeHandler.call(this.customElementInstance);

            expect(this.customElementInstance.files).toEqual(expectedValid);
            expect(this.customElementInstance.invalid).toEqual(expectedInvalid);
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

            this.customElementInstance.$.fileInput.files = [
                    {name: "pic.jpg", size: 1000},
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ];

            /* jshint quotmark:false */
            this.customElementInstance.extensions = '!["jpg"]';
            fileInput.changeHandler.call(this.customElementInstance);

            expect(this.customElementInstance.files).toEqual(expectedValid);
            expect(this.customElementInstance.invalid).toEqual(expectedInvalid);
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

            this.customElementInstance.$.fileInput.files = [
                    {name: "pic.jpg", size: 1000},
                    {name: "plain.txt", size: 2000},
                    {name: "foo.bar", size: 3000}
                ];

            /* jshint quotmark:false */
            this.customElementInstance.maxFiles = 1;
            fileInput.changeHandler.call(this.customElementInstance);

            expect(this.customElementInstance.files).toEqual(expectedValid);
            expect(this.customElementInstance.invalid).toEqual(expectedInvalid);
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

            this.customElementInstance.$.fileInput.files = [
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
            fileInput.changeHandler.call(this.customElementInstance);

            expect(this.customElementInstance.files).toEqual(expectedValid);
            expect(this.customElementInstance.invalid).toEqual(expectedInvalid);
         });

         it("marks the element as invalid on load if `required` attribute exists", function() {
            var delegateInputEl,
                fakeParent = jasmine.createSpyObj("fakeParent", ["insertBefore"]);

            this.customElementInstance.parentNode = fakeParent;
            fakeParent.insertBefore.and.callFake(function(delegateInput, customEl) {
                delegateInputEl = delegateInput;
                
                expect(delegateInput.tagName.toLowerCase()).toEqual("input");
                expect(delegateInputEl.validity.valid).toBe(true);
            });

            this.customElementInstance.files = [];
            this.customElementInstance.required = "";

            fileInput.domReady.call(this.customElementInstance);
            expect(delegateInputEl.validity.valid).toBe(false);
            expect(delegateInputEl.customElementRef).toEqual(this.customElementInstance);
         });

         it("marks the element as valid on load if `required` attribute exists once it is truly valid", function() {
            var delegateInputEl,
                fakeParent = jasmine.createSpyObj("fakeParent", ["insertBefore"]);

            this.customElementInstance.parentNode = fakeParent;
            fakeParent.insertBefore.and.callFake(function(delegateInput, customEl) {
                delegateInputEl = delegateInput;
            });

            this.customElementInstance.files = [];
            this.customElementInstance.required = "";

            fileInput.domReady.call(this.customElementInstance);
            
            this.customElementInstance.$.fileInput.files = [{name: "pic.jpg", size: 1000}];
            fileInput.changeHandler.call(this.customElementInstance);

            expect(delegateInputEl.validity.valid).toBe(true);
         });
    });
});