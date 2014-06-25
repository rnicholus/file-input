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
    }


/* globals Polymer */
Polymer("file-input", {
    changeHandler: function() {
        var files = Array.prototype.slice.call(this.$.fileInputInput.files),
            invalid = {count: 0},
            valid = [];
        
        var extensionValidationResult = getResultOfExtensionsValidation(this.extensions, files);
        var countLimitValidationResult = getResultOfCountLimitValidation(this.maxFiles, extensionValidationResult.valid);

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
    
    directory: false,
    
    files: [],
    
    invalidFiles: {count: 0},
    
    maxFiles: 0,

    ready: function() {
        if (this.maxFiles !== 1) {
            this.$.fileInputInput.setAttribute("multiple", "");    
        }
        
        if (this.directory && this.$.fileInputInput.webkitdirectory !== undefined) {
            this.$.fileInputInput.setAttribute("webkitdirectory", "");
        }
    }
});