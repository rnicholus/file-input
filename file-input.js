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
            }        
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
        
        var valid = []
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
    };


/* globals Polymer */
Polymer("file-input", {
    changeHandler: function() {
        var files = Array.prototype.slice.call(this.$.fileInputInput.files),
            invalid = {count: 0},
            valid = [];
        
        var sizeValidationResult = getResultOfSizeValidation(this.minSize, this.maxSize, files);
        var extensionValidationResult = getResultOfExtensionsValidation(this.extensions, sizeValidationResult.valid);
        var countLimitValidationResult = getResultOfCountLimitValidation(this.maxFiles, extensionValidationResult.valid);

        if (sizeValidationResult.tooBig.length) {
            invalid["tooBig"] = sizeValidationResult.tooBig;
            invalid.count += sizeValidationResult.tooBig.length;
        }
        if (sizeValidationResult.tooSmall.length) {
            invalid["tooSmall"] = sizeValidationResult.tooSmall;
            invalid.count += sizeValidationResult.tooSmall.length;
        }
        if (extensionValidationResult.invalid.length) {
            invalid["badExtensions"] = extensionValidationResult.invalid;
            invalid.count += extensionValidationResult.invalid.length;
        }
        if (countLimitValidationResult.invalid.length) {
            invalid["tooMany"] = countLimitValidationResult.invalid;
            invalid.count += countLimitValidationResult.invalid.length;
        }
        
        valid = countLimitValidationResult.valid;
        
        this.invalidFiles = invalid;
        this.files = valid;
        
        this.fire("change", {invalid: invalid, valid: valid});
    },
    
    created: function() {
        this.files = [],
        this.invalidFiles = {count: 0}
    },
    
    maxFiles: 0,
    
    maxSize: 0,
    
    minSize: 0,

    ready: function() {
        if (this.maxFiles !== 1) {
            this.$.fileInputInput.setAttribute("multiple", "");    
        }
        
        if (this.directory && this.$.fileInputInput.webkitdirectory !== undefined) {
            this.$.fileInputInput.setAttribute("webkitdirectory", "");
        }
    }
});