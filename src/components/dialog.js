const DIALOG_TYPE = [
    'custom', 'prompt', 'alert'
]
class WCDialog extends HTMLElement {
    templateName = 'dialog'
    dialogElm = null
    dialogInstanceElm = null
    closeElm = null
    constructor() {
        super()
    }

    _type = 'custom'
    _status = 'close'
    _animating = false

    static get observedAttributes() {
        return [
            'type',
            'prompt-type',
            'prompt-size',
            'prompt-required',
            'prompt-maxlength',
            'prompt-minlength',
            'prompt-min',
            'prompt-max',
            'prompt-regex',
            'prompt-disabled',
            'prompt-value'
        ];
    }

    set type(value) {
        // just allow set once
        if (DIALOG_TYPE.indexOf(value) !== -1 && !this._typeSetFlag) {
            this._typeSetFlag = true
            this._type = value
        }
    }

    get type() {
        return this._type
    }

    attributeChangedCallback(property, oldValue, newValue) {
        console.debug(" ")
        console.debug("======================= % WCUI Debug % =======================")
        console.debug(`%c[WC-Dialog #${ this.getAttribute('id') }]`,"color:red;")
        console.debug(`%o`,this)
        console.debug(`property ${ property } from ${ oldValue } to ${ newValue }`)
        console.debug("======================= % WCUI Debug % =======================")
        console.debug(" ")
        if(property.startsWith('prompt-')){
            this[property] = newValue;
            this._injectPromptProperties([property])
        }else if (oldValue === newValue){
            return
        }
        
        this[property] = newValue;
    }
    async connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' })
        shadow.append(document.getElementById(`${this.templateName}-template`).content.cloneNode(true))

        this.dialogElm = shadow.querySelector('.dialog')
        this.dialogElm.classList.remove(...DIALOG_TYPE.map(t => `dialog-type-${t}`))

        this.dialogElm.classList.add(`dialog-type-${this.type}`)
        this.dialogInstanceElm = this.dialogElm.querySelector(`.dialog-${this.type}`)

        this.closeElm = this.dialogInstanceElm.querySelector('.close')

        this.dialogInstanceElm.addEventListener('animationend', this._onAnimationEnd)
        this.closeElm.addEventListener('click', this._closeDialog)

        // prompt dialog
        if (this._type === 'prompt') {
            this._injectPromptProperties()
            const okButton = this.dialogInstanceElm.querySelector('.ok-button')
            const cancelButton = this.dialogInstanceElm.querySelector('.cancel-button')

            okButton.addEventListener('click', () => {
                const inputElm = this.dialogInstanceElm.querySelector('wc-input')
                const promptOkEvent = new CustomEvent('PromptOk', { detail: { value: inputElm.value } })
                
                this._closeDialog()
                this.dialogInstanceElm.addEventListener('animationend', ()=>{
                    this.dispatchEvent(promptOkEvent)
                },{
                    once:true
                })
            })
            cancelButton.addEventListener('click', () => {
                const promptCancelEvent = new CustomEvent('PromptCancel')       
                this._closeDialog()
                this.dialogInstanceElm.addEventListener('animationend', ()=>{
                    this.dispatchEvent(promptCancelEvent)
                },{
                    once:true
                })
            })
            this.closeElm.addEventListener('click', () => {
                const promptCancelEvent = new CustomEvent('PromptCancel')
                this._closeDialog()
                this.dialogInstanceElm.addEventListener('animationend', ()=>{
                    this.dispatchEvent(promptCancelEvent)
                },{
                    once:true
                })
            })
        }
        // alert dialog
        if (this._type === 'alert') {
            const okButton = this.dialogInstanceElm.querySelector('.ok-button')

            okButton.addEventListener('click',()=>{
                this._closeDialog()
            })
        }
    }
    _onAnimationEnd = () => {
        this._animating = false
        this.dialogElm.classList.remove('close-animate', 'open-animate')
        if (this._status === 'close') {
            this.dialogElm.classList.remove('open')
            document.body.classList.remove('noscroll')
        }
    }
    _closeDialog = () => {
        this._status = 'close'
        this._animating = true
        this.dialogElm.classList.add('close-animate')
    }
    // public method close
    close() {
        if (this._animating || this._status === 'close') return
        this._closeDialog()
    }
    //public method open
    open = () => {
        if (this._animating || this._status === 'open') return
        this._status = 'open'
        this._animating = true
        document.body.classList.add('noscroll')
        this.dialogElm.classList.add('open', 'open-animate')
    }
    /**
     * @description a async methods for prompt call,type 'prompt' required, resolve with value ,reject if closed or not a prompt
     * @returns { Promise }
     */
    prompt() {
        return new Promise((resolve, reject) => {
            if (this.type !== 'prompt') {
                reject('not a prompt')
                return
            }
            this.open()
            const onceOk = (ev) => {
                const wcInputElm = this.dialogInstanceElm.querySelector('wc-input')
                wcInputElm._clear()
                resolve(ev.detail.value)
            }
            const onceCancel = () => {
                const wcInputElm = this.dialogInstanceElm.querySelector('wc-input')
                wcInputElm._clear()
                reject('prompt close')
            }
            this.addEventListener('PromptOk', (ev) => {
                onceOk(ev)
                this.removeEventListener('PromptCancel', onceCancel)
            }, {
                once: true
            })
            this.addEventListener('PromptCancel', () => {
                onceCancel()
                this.removeEventListener('PromptOk', onceOk)
            }, {
                once: true
            })
        })
    }
    /**
     * @description react 'prompt-*' property to <wc-input ...[properties]>,see wc-input control
     * @param {String[]|null} properties properties to sync with prompt input,like ['prompt-maxlength'],if empty array,sync all property
     */
    _injectPromptProperties(properties){
        if(this.dialogInstanceElm){
            let wcInputElm = this.dialogInstanceElm.querySelector('wc-input')
            if(!wcInputElm){
                return          
            }
            if(!Array.isArray(properties)){
                properties = WCDialog.observedAttributes.filter(e=>e.startsWith('prompt-'))
            }
            properties.forEach(p=>{
                if(p.startsWith('prompt-') && this[p] !== undefined){
                    wcInputElm.setAttribute(p.slice(7),this[p])
                }            
            })
        }
    }
    /**
     * @description alert a message 
     * @param {String} alertMsg alert message
     * @return {void}
     */
    alert(alertMsg){
        if(this._type !== 'alert') return;
        this.dialogInstanceElm.querySelector('.alert-content').innerHTML = alertMsg
        this.open()
    }

}
window.customElements.define('wc-dialog', WCDialog)
if (window.customElementsLoadedCount) {
    window.customElementsLoadedCount++
} else {
    window.customElementsLoadedCount = 1
}