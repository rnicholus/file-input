(function() {
    var getLowerCaseExtension = function(filename) {
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
        resetInput = function() {
            // create a form with a hidden reset button
            var tempForm = document.createElement("form"),
                tempResetButton = document.createElement("button");

            tempResetButton.setAttribute("type", "reset");
            tempResetButton.style.display = "none";
            tempForm.appendChild(tempResetButton);

            // temporarily move the `<input type="file">` into the form & add form to DOM
            this.$.fileInputInput.parentNode.insertBefore(tempForm, this.$.fileInputInput);
            tempForm.appendChild(this.$.fileInputInput);

            // reset the `<input type="file">`
            tempResetButton.click();

            // move the `<input type="file">` back to its original spot & remove form
            tempForm.parentNode.appendChild(this.$.fileInputInput);
            tempForm.parentNode.removeChild(tempForm);
        };


   this.fileInput = {
        changeHandler: function() {
            var files = Array.prototype.slice.call(this.$.fileInputInput.files),
                invalid = {count: 0},
                valid = [];

            var sizeValidationResult = getResultOfSizeValidation(this.minSize, this.maxSize, files);
            var extensionValidationResult = getResultOfExtensionsValidation(this.extensions, sizeValidationResult.valid);
            var countLimitValidationResult = getResultOfCountLimitValidation(this.maxFiles, extensionValidationResult.valid);

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

            this.invalid = invalid;
            this.files = valid;

            this.fire("change", {invalid: invalid, valid: valid});
        },

        created: function() {
            this.files = [];
            this.invalid = {count: 0};
        },

        maxFiles: 0,

        maxSize: 0,

        minSize: 0,
        
        ready: function() {
            if (this.camera != null && isIos()) {
                this.maxFiles = 1;

                var iosCameraAccept = "image/*;capture=camera";
                if (this.accept && this.accept.length.trim().length > 0) {
                    this.accept += "," + iosCameraAccept;
                }
                else {
                    this.accept = iosCameraAccept;
                }
            }

            if (this.maxFiles !== 1) {
                this.$.fileInputInput.setAttribute("multiple", "");
            }

            if (this.directory != null && this.$.fileInputInput.webkitdirectory !== undefined) {
                this.$.fileInputInput.setAttribute("webkitdirectory", "");
            }
        },

        reset: function() {
            this.created();
            resetInput.call(this);
        }
    };
}());