var getResultOfCountLimitValidation = function(limit, files) {
    if (limit > 0 && limit < files.length) {
        return {
            invalid: files.slice(limit, files.length),
            valid: files.slice(0, limit)
        }        
    }

    return {invalid: [], valid: files};
};

/* globals Polymer */
Polymer("file-input", {
    changeHandler: function() {
        var files = Array.prototype.slice.call(this.$.fileInputInput.files),
            invalid = {count: 0},
            valid = [];
        
        var countLimitValidationResult = getResultOfCountLimitValidation(this.maxFiles, files);

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