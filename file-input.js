// jshint maxparams:4
/*global HTMLElement, CustomEvent*/
var fileInput = (function() {
    var insertIntoDocument = (function () {
            "use strict";
            var importDoc;

            importDoc = (document._currentScript || document.currentScript).ownerDocument;

            return function (obj, idTemplate) {
                var template = importDoc.getElementById(idTemplate),
                    clone = document.importNode(template.content, true);

                obj.appendChild(clone);
            };
        }()),
        declaredProps = (function () {
            "use strict";
            var exports = {};

            function parse(val, type) {
                switch (type) {
                    case Number:
                        return parseFloat(val || 0, 10);
                    case Boolean:
                        return val !== null;
                    case Object:
                    case Array:
                        return JSON.parse(val);
                    case Date:
                        return new Date(val);
                    default:
                        return val || "";
                }
            }
            function toHyphens(str) {
                return str.replace(/([A-Z])/g, "-$1").toLowerCase();
            }
            function toCamelCase(str) {
                return str.split("-")
                    .map(function (x, i) {
                        return i === 0 ? x : x[0].toUpperCase() + x.slice(1);
                    }).join("");
            }
            exports.serialize = function (val) {
                if (typeof val === "string") {
                    return val;
                }
                if (typeof val === "number" || val instanceof Date) {
                    return val.toString();
                }
                return JSON.stringify(val);
            };

            exports.syncProperty = function (obj, props, attr, val) {
                var name = toCamelCase(attr), type;
                if (props[name]) {
                    type = props[name].type || props[name];
                    obj[name] = parse(val, type);
                }
            };

            exports.init = function (obj, props) {
                Object.defineProperty(obj, "props", {
                    enumerable : false,
                    configurable : true,
                    value : {}
                });

                Object.keys(props).forEach(function (name) {
                    var attrName = toHyphens(name), desc, value;

                    desc = props[name].type ? props[name] : { type : props[name] };
                    value = typeof desc.value === "function" ? desc.value() : desc.value;
                    obj.props[name] = obj[name] || value;

                    if (obj.getAttribute(attrName) === null) {
                        if (desc.reflectToAttribute) {
                            obj.setAttribute(attrName, exports.serialize(obj.props[name]));
                        }
                    } else {
                        obj.props[name] = parse(obj.getAttribute(attrName), desc.type);
                    }
                    Object.defineProperty(obj, name, {
                        get : function () {
                            return obj.props[name] || parse(obj.getAttribute(attrName), desc.type);
                        },
                        set : function (val) {
                            var old = obj.props[name];
                            obj.props[name] = val;
                            if (desc.reflectToAttribute) {
                                if (desc.type === Boolean) {
                                    if (val) {
                                        obj.setAttribute(attrName, "");
                                    } else {
                                        obj.removeAttribute(attrName);
                                    }
                                } else {
                                    obj.setAttribute(attrName, exports.serialize(val));
                                }
                            }
                            if (typeof obj[desc.observer] === "function") {
                                obj[desc.observer](val, old);
                            }
                        }
                    });
                });
            };

            return exports;
        }()),

        arrayOf = function(pseudoArray) {
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
        // from the CE.
        resetInput = function(customEl) {
            // create a form with a hidden reset button
            var tempForm = document.createElement("form"),
                fileInput = customEl.querySelector(".fileInput"),
                tempResetButton = document.createElement("button");

            tempResetButton.setAttribute("type", "reset");
            tempResetButton.style.display = "none";
            tempForm.appendChild(tempResetButton);

            // temporarily move the `<input type="file">` into the form & add form to DOM
            fileInput.parentNode.insertBefore(tempForm, fileInput);
            tempForm.appendChild(fileInput);

            // reset the `<input type="file">`
            tempResetButton.click();

            // move the `<input type="file">` back to its original spot & remove form
            tempForm.parentNode.appendChild(fileInput);
            tempForm.parentNode.removeChild(tempForm);

            customEl.files = [];
            customEl.invalid = {count: 0};
            customEl.valid = [];

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

        validationTarget,

        properties = {
            accept : {
                type : String,
                observer : "setAccept"
            },
            camera : Boolean,
            directory : {
                type: Boolean,
                value: false,
                observer: "setDirectory"
            },
            extensions : {
                type : String //JSON array
            },
            maxFiles : {
                type : Number,
                value : 0,
                observer : "setMaxFiles"
            },
            maxSize : {
                type : Number,
                value : 0
            },
            minSize : {
                type : Number,
                value : 0
            },
            required: {
                type : Boolean,
                value: false
            }
        };

    var fileInputPrototype = Object.create(HTMLElement.prototype);
    fileInputPrototype.changeHandler = function(event) {
        event.stopPropagation();

        var customEl = this,
        fileInput = customEl.querySelector(".fileInput"),
        files = arrayOf(fileInput.files),
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
            customEl.dispatchEvent(new CustomEvent("change", { detail : {invalid: invalid, valid: valid} }));
        }
    };


    fileInputPrototype.invalidText = "No valid files selected.";

    fileInputPrototype.setAccept = function (val) {
        var fileInput = this.querySelector(".fileInput");
        fileInput.setAttribute("accept", val);
    };

    fileInputPrototype.setDirectory = function(val) {
        var fileInput = this.querySelector(".fileInput");
        if (val && fileInput.webkitdirectory !== undefined) {
            fileInput.setAttribute("webkitdirectory", "");
        }
        else {
            fileInput.removeAttribute("webkitdirectory");
        }
    };

    fileInputPrototype.setMaxFiles = function (val) {
        var fileInput = this.querySelector(".fileInput");
        if (val !== 1) {
            fileInput.setAttribute("multiple", "");
        }
        else {
            fileInput.removeAttribute("multiple");
        }
    };

    fileInputPrototype.attributeChangedCallback = function(attr, oldVal, newVal) {
        declaredProps.syncProperty(this, properties, attr, newVal);
    };

    fileInputPrototype.createdCallback = function() {
        var fileInput, customEl = this;

        insertIntoDocument(this, "file-input");
        declaredProps.init(this, properties);

        this.setAccept(this.accept);

        fileInput = customEl.querySelector(".fileInput");
        fileInput.addEventListener("change", this.changeHandler.bind(this));

        customEl.files = [];
        customEl.invalid = {count: 0};

        if (customEl.camera && isIos()) {
            customEl.maxFiles = 1;

            var iosCameraAccept = "image/*;capture=camera";
            if (customEl.accept && customEl.accept.length.trim().length > 0) {
                customEl.accept += "," + iosCameraAccept;
            }
            else {
                customEl.accept = iosCameraAccept;
            }
        }

        this.setMaxFiles(customEl.maxFiles);
        this.setDirectory(customEl.directory);

        if (customEl.required) {
            setupValidationTarget(customEl);
        }
    };

    fileInputPrototype.reset = function() {
        var customEl = this;

        resetInput(customEl);
    };

    return fileInputPrototype;
}());
