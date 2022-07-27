const validators = {
    'required':function(input, isRequired){
        if(!isRequired || input){
            return [true]
        }else {
            return [false,'此选项为必填']
        }
    },
    'maxlength': function (input, validatorValue) {
        if (input.length > validatorValue) {
            return [false, `输入字符数量不应超过${validatorValue}位`]
        } else {
            return [true]
        }
    },
    'minlength': function (input, validatorValue) {
        if (input.length < validatorValue) {
            return [false, `输入字符数量不应少于${validatorValue}位`]
        } else {
            return [true]
        }
    },
    'max': function (input, validatorValue) {
        if (parseFloat(validatorValue) > parseFloat(input)) {
            return [true]
        } else {
            return [false, `请输入小于${validatorValue}位`]
        }
    },
    'min': function (input, validatorValue) {
        if (parseFloat(input) > parseFloat(validatorValue)) {
            return [true]
        } else {
            return [false, `请输入大于${validatorValue}位`]
        }
    },
    'regex': function (input, regex) {
        if (regex.test(input)) {
            return [true]
        } else {
            return [false, '格式不正确']
        }
    }
}
const validatorKeys = Object.keys(validators)
class WCInput extends HTMLElement {
    templateName = 'input'
    rootElem = null
    inputElm = null
    formElement = null
    limits = null
    _type = 'text'
    constructor() {
        super()
    }
    static get observedAttributes() {
        return ['required','maxlength', 'minlength', 'type', 'max', 'min', 'regex', 'form', 'name','disabled','value','preventclean'];
    }

    set type(value){
        if(['number'].indexOf(value)!==-1 && !this._typeSetFlag){
            this._typeSetFlag = true
            this._type = value
        }
    }

    get type(){
        return this._type
    }
    attributeChangedCallback(property, oldValue, newValue) {
        console.debug(" ")
        console.debug("======================= % WCUI Debug % =======================")
        console.debug(`%c[WC-Input #${ this.getAttribute('id') }]`,"color:red;")
        console.debug(`%o`,this)
        console.debug(`property ${ property } from ${ oldValue } to ${ newValue }`)
        console.debug("======================= % WCUI Debug % =======================")
        console.debug(" ")
        if (validatorKeys.indexOf(property) !== -1) {
            if (this.limits) {
                this.limits[property] = newValue
            } else {
                this.limits = {
                    [property]: newValue
                }
            }
        } else {
            if(property === 'value'){
                // set value reactive
                this.inputElm && (this.inputElm.value = newValue)
                this.value = newValue
                this.inputElm && this._validateOnce()
                this._materialAnimate()
            }else if(property === 'disabled'){
                this.inputElm.setAttribute('disabled', newValue)
            }else if(oldValue !== newValue){
                this[property] = newValue;
            }           
        }
    }
    async connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' })
        shadow.append(document.getElementById(`${this.templateName}-template`).content.cloneNode(true))
        this.rootElem = shadow.querySelector('.input')
        this.inputElm = shadow.querySelector('input')
        this.labelElm = shadow.querySelector('.label')
        this.errorMsgElm = shadow.querySelector('.errorMsg')

        // style special
        if (this._type === 'number') {
            this.inputElm.setAttribute('type', 'number')
        }
        if(this.disabled){
            this.inputElm.setAttribute('disabled', 'disabled')
        }
        // set init value property
        if(this.value){
            this.inputElm.setAttribute('value',this.value)
            this._materialAnimate()
        }

        // bind form
        if (this.name && this.form && window[this.form]) {
            this.formElement = {
                name: this.name,
                validated: false,
                value: '',
                errorMsg: '',
                clear:()=>{
                    this._clear()
                },
                validate:()=>{
                    this._validateOnce()
                }
            }
            window[this.form].registerFormElement(this.formElement)
        }
        
        
        this.inputElm.addEventListener('input', () => {
            // material animate
            this._materialAnimate()
            // react value property
            this.value = this.inputElm.value
            this._validateOnce()
        })
        this.inputElm.addEventListener('change', () => {
            this._materialAnimate()
        })

        
    }
    _materialAnimate(){
        if(!this.inputElm) return
        if (this.inputElm.value) {
            this.labelElm.classList.add('has-value')
        } else {
            this.labelElm.classList.remove('has-value')
        }
    }
    _validateOnce() {
        let validateErrorMsg = ''
        if (this.formElement) {
            this.formElement.value = this.inputElm.value
        }
        let validateErrorFlag = Object.keys(this.limits || {}).some((validatorName) => {
            let [validated, errorMsg] = validators[validatorName](this.inputElm.value, this.limits[validatorName])
            if (!validated) {
                validateErrorMsg = errorMsg
                return true
            }
        })
        if (validateErrorFlag) {
            if (this.formElement) {
                this.formElement.validated = false
                this.formElement.errorMsg = validateErrorMsg
            }
            // render errorMsg
            this.rootElem.classList.add('validate-fail')
            this.errorMsgElm.innerHTML = validateErrorMsg
        } else {
            if (this.formElement) {
                this.formElement.validated = true
            }
            
            this.rootElem.classList.remove('validate-fail')
            this.errorMsgElm.innerHTML = ''
        }

    }
    _clear(){
        if(!this.preventclean){
            this.inputElm.value = ''
            this.value = ''
            this.rootElem.classList.remove('validate-fail')
            this.errorMsgElm.innerHTML = ''
            this._materialAnimate()
        }
    }
}

window.customElements.define('wc-input', WCInput)

if(window.customElementsLoadedCount){
    window.customElementsLoadedCount ++
}else {
    window.customElementsLoadedCount = 1
}