const filesMap = new WeakMap()
const invalidMap = new WeakMap()
const validationTargetMap = new WeakMap()

const iosCameraAccept = 'image/*;capture=camera'

const arrayOf = pseudoArray => {
    return Array.prototype.slice.call(pseudoArray)
}

const getLowerCaseExtension = filename => {
    const extIdx = filename.lastIndexOf('.') + 1

    if (extIdx > 0) {
        return filename.substr(extIdx, filename.length - extIdx).toLowerCase()
    }
}

const getResultOfCountLimitValidation = (limit, files) => {
    if (limit > 0 && limit < files.length) {
        return {
            invalid: files.slice(limit, files.length),
            valid: files.slice(0, limit)
        }
    }

    return { invalid: [], valid: files }
}

const getResultOfExtensionsValidation = (extensions, negate, files) => {
    if (extensions) {
        const result = { invalid: [], valid: [] }

        files.forEach(file => {
            const extension = getLowerCaseExtension(file.name)

            if (extensions.indexOf(extension) >= 0) {
                result[negate ? 'invalid' : 'valid'].push(file)
            }
            else {
                result[negate? 'valid' : 'invalid'].push(file)
            }
        })

        return result
    }

    return { invalid: [], valid: files }
}

const getResultOfSizeValidation = (minSize, maxSize, files) => {
    if (!minSize && !maxSize) {
        return {
            tooBig: [],
            tooSmall: [],
            valid: files
        }
    }

    const tooBig = []
    const tooSmall = []
    const valid = []

    files.forEach(file => {
        if (minSize && file.size < minSize) {
            tooSmall.push(file)
        }
        else if (maxSize && file.size > maxSize) {
            tooBig.push(file)
        }
        else {
            valid.push(file)
        }
    });

    return {
        tooBig: tooBig,
        tooSmall: tooSmall,
        valid: valid
    }
}

const getStylesheet = () => {
    return (
        `
        <style>
        :host {
            position: relative;
        }

        .file-input {
            bottom: 0;
            height: 100%;
            left: 0;
            margin: 0;
            opacity: 0;
            padding: 0;
            position: absolute;
            right: 0;
            top: 0;
            width: 100%;
        }
        </style>
        `
    )
}

const isIos = () => {
    return navigator.userAgent.indexOf("iPad") !== -1 ||
        navigator.userAgent.indexOf("iPod") !== -1 ||
        navigator.userAgent.indexOf("iPhone") !== -1;
}

class FileInput extends HTMLElement {
    static get observedAttributes() {
        return [
            'accept',
            'camera',
            'directory',
            'maxFiles',
            'maxSize',
            'minSize',
            'required'
        ]
    }

    constructor() {
        super()

        this._onChangeHandler = this._onChange.bind(this)
    }

    attributeChangedCallback(attributeName, oldValue, newValue) {
        this[attributeName] = newValue
    }

    connectedCallback() {
        this.insertAdjacentHTML(
            'beforeend', 
            '<input class="file-input" type="file">'
        )

        this.insertAdjacentHTML(
            'afterbegin',
            getStylesheet()
        )
        
        const input = this.querySelector('.file-input')

        input.addEventListener('change', this._onChangeHandler)

        filesMap.set(this, [])
        invalidMap.set(this, { count: 0 })

        this.invalidText = 'No valid files selected.'
    }

    disconnectedCallback() {
        const input = this.querySelector('.file-input')

        input.removeEventListener('change', this._onChangeHandler)
    }

    get accept() {
        return this.getAttribute('accept')
    }

    set accept(accept) {
        this.setAttribute('accept', accept)

        const input = this.querySelector('.file-input')
        input.setAttribute('accept', accept)
    }

    get camera() {
        return this.hasAttribute('camera')
    }

    set camera(camera) {
        if (camera) {
            this.setAttribute('camera', '')

            if (isIos()) {
                this.maxFiles = 1

                if (this.accept && this.accept.length.trim().length > 0) {
                    this.accept += ',' + iosCameraAccept
                }
                else {
                    this.accept = iosCameraAccept
                }
            }
        }
        else {
            this.removeAttribute('camera')
        }
    }

    get directory() {
        return this.hasAttribute('directory')
    }

    set directory(directory) {
        const input = this.querySelector('.file-input')

        if (directory) {
            this.setAttribute('directory', '')
            input.setAttribute('webkitdirectory', '')
        }
        else {
            this.removeAttribute('directory')
            input.removeAttribute('webkitdirectory')
        }
    }

    get files() {
        return filesMap.get(this)
    }

    get invalid() {
        return invalidMap.get(this)
    }

    get maxFiles() {
        if (this.hasAttribute('maxFiles')) {
            return parseInt(this.getAttribute('maxFiles'))
        }

        return 0
    }

    set maxFiles(maxFiles) {
        this.setAttribute('maxFiles', maxFiles)

        const input = this.querySelector('.file-input')

        if (maxFiles !== 1) {
            input.setAttribute('multiple', '')
        }
        else {
            input.removeAttribute('multiple')
        }
    }

    get maxSize() {
        if (this.hasAttribute('maxSize')) {
            return parseInt(this.getAttribute('maxSize'))
        }

        return 0
    }

    set maxSize(maxSize) {
        this.setAttribute('maxSize', maxSize)
    }

    get minSize() {
        if (this.hasAttribute('minSize')) {
            return parseInt(this.getAttribute('minSize'))
        }

        return 0
    }

    set minSize(minSize) {
        this.setAttribute('minSize', minSize)
    }

    get required() {
        return this.hasAttribute('required')
    }

    set required(required) {
        if (required) {
            this.setAttribute('required', '')
            setupValidationTarget(customEl)
        }
        else {
            this.removeAttribute('required')
        }
    }

    // This is the only way (I am aware of) to reset an `<input type="file">`
    // without removing it from the DOM.  Removing it disconnects it
    // from the CE.
    reset() {
        // create a form with a hidden reset button
        const tempForm = document.createElement('form')
        const input = this.querySelector('.file-input')
        const tempResetButton = document.createElement('button')

        tempResetButton.setAttribute('type', 'reset')
        tempResetButton.style.display = 'none'
        tempForm.appendChild(tempResetButton);

        // temporarily move the `<input type="file">` into the form & add form to DOM
        input.parentNode.insertBefore(tempForm, input);
        tempForm.appendChild(input);

        // reset the `<input type="file">`
        tempResetButton.click();

        // move the `<input type="file">` back to its original spot & remove form
        tempForm.parentNode.appendChild(input);
        tempForm.parentNode.removeChild(tempForm);

        filesMap.set(this, [])
        invalidMap.set(this, { count: 0 })

        this._updateValidity()
    }
    
    _onChange(event) {
        event.stopPropagation()

        const input = this.querySelector('.file-input')

        const files = arrayOf(input.files)
        const invalid = { count: 0 }
        let valid = []

        // Some browsers may fire a change event when the file chooser
        // dialog is closed via cancel button.  In this case, the
        //files array will be empty and the event should be ignored.
        if (files.length) {
            const sizeValidationResult = getResultOfSizeValidation(this.minSize, this.maxSize, files)
            const extensionValidationResult = getResultOfExtensionsValidation(this.extensions || this.notExtensions, this.notExtensions ? true : false, sizeValidationResult.valid)
            const countLimitValidationResult = getResultOfCountLimitValidation(this.maxFiles, extensionValidationResult.valid)

            if (sizeValidationResult.tooBig.length) {
                invalid.tooBig = sizeValidationResult.tooBig
                invalid.count += sizeValidationResult.tooBig.length
            }
            if (sizeValidationResult.tooSmall.length) {
                invalid.tooSmall = sizeValidationResult.tooSmall
                invalid.count += sizeValidationResult.tooSmall.length
            }
            if (extensionValidationResult.invalid.length) {
                invalid.badExtension = extensionValidationResult.invalid
                invalid.count += extensionValidationResult.invalid.length
            }
            if (countLimitValidationResult.invalid.length) {
                invalid.tooMany = countLimitValidationResult.invalid
                invalid.count += countLimitValidationResult.invalid.length
            }

            valid = countLimitValidationResult.valid

            invalidMap.set(this, invalid)
            filesMap.set(this, valid)

            this._updateValidity()

            this.dispatchEvent(
                new CustomEvent(
                    'change',
                    {
                        detail: { invalid: invalid, valid: valid }
                    }
                )
            )
        }
    }

    _setupValidationTarget(customEl) {
        let validationTarget = document.createElement('input')

        validationTarget.setAttribute('tabindex', '-1')
        validationTarget.setAttribute('type', 'text')

        // Strange margin/padding needed to ensure some browsers
        // don't hide the validation message immediately after it
        // appears (Chrome at this time)
        validationTarget.style.padding = '1px'
        validationTarget.style.margin = '-1px'

        validationTarget.style.border = 0
        validationTarget.style.height = 0
        validationTarget.style.opacity = 0
        validationTarget.style.width = 0

        validationTarget.className = 'fileInputDelegate'

        validationTarget.customElementRef = customEl

        this.parentNode.insertBefore(validationTarget, customEl)

        validationTargetMap.set(this, validationTarget)

        this._updateValidity()
    }

    _updateValidity() {
        const validationTarget = validationTargetMap.get(this)

        if (validationTarget) {
            if (filesMap.get(this).length) {
                validationTarget.setCustomValidity('')
            }
            else {
                validationTarget.setCustomValidity(this.invalidText)
            }
        }
    }
}

// export default FileInput

customElements.define('file-input', FileInput)
