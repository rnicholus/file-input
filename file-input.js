(function() {
    var arrayOf = function(pseudoArray) {
            return Array.prototype.slice.call(pseudoArray);
        },

        getLowerCaseExtension = function(filename) {
            var extIdx = filename.lastIndexOf(".") + 1;

            if (extIdx > 0) {
                return filename.substr(extIdx, filename.length - extIdx).toLowerCase();
            }
        },

        getResultOfCountLimitValidation = function(limit, files) {
            if (limit > 0 && limit < files.length) {
                return {
                    invalid: files.slice(limit, files.length),
                    valid: files.slice(0, limit)
                };
            }

            return {invalid: [], valid: files};
        },

        getResultOfExtensionsValidation = function(extensionsStr, files) {
            if (extensionsStr) {
                var negate = extensionsStr.charAt(0) === "!",
                    extensions = JSON.parse(extensionsStr.toLowerCase().substr(negate ? 1 : 0)),
                    result = {invalid: [], valid: []};

                files.forEach(function(file) {
                    var extension = getLowerCaseExtension(file.name);

                    if (extensions.indexOf(extension) >= 0) {
                        result[negate ? "invalid" : "valid"].push(file);
                    }
                    else {
                        result[negate? "valid" : "invalid"].push(file);
                    }
                });

                return result;
            }

            return {invalid: [], valid: files};
        },

        getResultOfSizeValidation = function(minSize, maxSize, files) {
            if (!minSize && !maxSize) {
                return {tooBig: [], tooSmall: [], valid: files};
            }

            var valid = [],
                tooBig = [],
                tooSmall = [];

            files.forEach(function(file) {
                if (minSize && file.size < minSize) {
                    tooSmall.push(file);
                }
                else if (maxSize && file.size > maxSize) {
                    tooBig.push(file);
                }
                else {
                    valid.push(file);
                }
            });

            return {tooBig: tooBig, tooSmall: tooSmall, valid: valid};
        },

        isIos = function() {
            return navigator.userAgent.indexOf("iPad") !== -1 ||
                navigator.userAgent.indexOf("iPod") !== -1 ||
                navigator.userAgent.indexOf("iPhone") !== -1;
        },

        // This is the only way (I am aware of) to reset an `<input type="file">`
        // without removing it from the DOM.  Removing it disconnects it
        // from the CE/Polymer.
        resetInput = function(customEl) {
            // create a form with a hidden reset button
            var tempForm = document.createElement("form"),
                tempResetButton = document.createElement("button");

            tempResetButton.setAttribute("type", "reset");
            tempResetButton.style.display = "none";
            tempForm.appendChild(tempResetButton);

            // temporarily move the `<input type="file">` into the form & add form to DOM
            customEl.$.fileInput.parentNode.insertBefore(tempForm, customEl.$.fileInput);
            tempForm.appendChild(customEl.$.fileInput);

            // reset the `<input type="file">`
            tempResetButton.click();

            // move the `<input type="file">` back to its original spot & remove form
            tempForm.parentNode.appendChild(customEl.$.fileInput);
            tempForm.parentNode.removeChild(tempForm);

            updateValidity(customEl);
        },

        setupValidationTarget = function(customEl) {
            validationTarget = document.createElement("input");
            validationTarget.setAttribute("tabindex", "-1");
            validationTarget.setAttribute("type", "text");

            // Strange margin/padding needed to ensure some browsers 
            // don't hide the validation message immediately after it 
            // appears (Chrome at this time)
            validationTarget.style.padding = "1px";
            validationTarget.style.margin = "-1px";

            validationTarget.style.border = 0;
            validationTarget.style.height = 0;
            validationTarget.style.opacity = 0;
            validationTarget.style.width = 0;
            
            validationTarget.className = "fileInputDelegate";

            validationTarget.customElementRef = customEl;

            customEl.parentNode.insertBefore(validationTarget, customEl);

            updateValidity(customEl);
        },

        updateValidity = function(customEl) {
            if (validationTarget) {
                if (customEl.files.length) {
                    validationTarget.setCustomValidity("");
                }
                else {
                    validationTarget.setCustomValidity(customEl.invalidText);
                }
            }
        },

        validationTarget;


   this.fileInput = {
        changeHandler: function() {
            var customEl = this,
                files = arrayOf(customEl.$.fileInput.files),
                invalid = {count: 0},
                valid = [];

            // Some browsers may fire a change event when the file chooser
            // dialog is closed via cancel button.  In this case, the
            //files array will be empty and the event should be ignored.
            if (files.length) {
                var sizeValidationResult = getResultOfSizeValidation(customEl.minSize, customEl.maxSize, files);
                var extensionValidationResult = getResultOfExtensionsValidation(customEl.extensions, sizeValidationResult.valid);
                var countLimitValidationResult = getResultOfCountLimitValidation(customEl.maxFiles, extensionValidationResult.valid);

                if (sizeValidationResult.tooBig.length) {
                    invalid.tooBig = sizeValidationResult.tooBig;
                    invalid.count += sizeValidationResult.tooBig.length;
                }
                if (sizeValidationResult.tooSmall.length) {
                    invalid.tooSmall = sizeValidationResult.tooSmall;
                    invalid.count += sizeValidationResult.tooSmall.length;
                }
                if (extensionValidationResult.invalid.length) {
                    invalid.badExtension = extensionValidationResult.invalid;
                    invalid.count += extensionValidationResult.invalid.length;
                }
                if (countLimitValidationResult.invalid.length) {
                    invalid.tooMany = countLimitValidationResult.invalid;
                    invalid.count += countLimitValidationResult.invalid.length;
                }

                valid = countLimitValidationResult.valid;

                customEl.invalid = invalid;
                customEl.files = valid;

                updateValidity(customEl);
                customEl.fire("change", {invalid: invalid, valid: valid});
            }
        },

        created: function() {
            var customEl = this;

            customEl.files = [];
            customEl.invalid = {count: 0};
        },

        invalidText: "No valid files selected.",

        maxFiles: 0,

        maxSize: 0,

        minSize: 0,

        domReady: function() {
            var customEl = this;

            if (customEl.camera != null && isIos()) {
                customEl.maxFiles = 1;

                var iosCameraAccept = "image/*;capture=camera";
                if (customEl.accept && customEl.accept.length.trim().length > 0) {
                    customEl.accept += "," + iosCameraAccept;
                }
                else {
                    customEl.accept = iosCameraAccept;
                }
            }

            if (customEl.maxFiles !== 1) {
                customEl.$.fileInput.setAttribute("multiple", "");
            }

            if (customEl.directory != null && customEl.$.fileInput.webkitdirectory !== undefined) {
                customEl.$.fileInput.setAttribute("webkitdirectory", "");
            }

            if (customEl.required != null) {
                setupValidationTarget(customEl);
            }
        },

        reset: function() {
            var customEl = this;

            customEl.created();
            resetInput(customEl);
        }
    };
}());