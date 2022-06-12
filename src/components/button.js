const BUTTON_TYPE = [
    'button-primary',
    'button-seconary',
];
const BUTTON_SIZE = [
    'small',
    'normal',
    'big'
]
class WCButton extends HTMLElement {
    templateName = 'button'
    buttonElm = null

    constructor(){
        super()
    }
    static get observedAttributes() {
        return ['type', 'size'];
    }
    // attribute change
    attributeChangedCallback(property, oldValue, newValue) {
        console.debug(" ")
        console.debug("======================= % WCUI Debug % =======================")
        console.debug(`%c[WC-Button #${ this.getAttribute('id') }]`,"color:red;")
        console.debug(`%o`,this)
        console.debug(`property ${ property } from ${ oldValue } to ${ newValue }`)
        console.debug("======================= % WCUI Debug % =======================")
        console.debug(" ")
        if (oldValue === newValue) return;
        this[property] = newValue;

        if(this.buttonElm){
            switch(property){
                case 'type':
                    this.buttonElm.classList.remove(...BUTTON_TYPE)
                    this.buttonElm.classList.add(`button-${newValue}`)
                    break;
                case 'size':
                    this.buttonElm.classList.remove(...BUTTON_SIZE)
                    this.buttonElm.classList.add(newValue)
                default:
                    return;
            }
        }
        
    }
    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' })
        shadow.append(document.getElementById(`${this.templateName}-template`).content.cloneNode(true))

        this.buttonElm = this.shadowRoot.querySelector('button')

        // init property
        this['type'] && this.buttonElm.classList.add(`button-${this['type']}`)
        this['size'] && this.buttonElm.classList.add(this['size'])
    }
}

window.customElements.define('wc-button', WCButton)
if(window.customElementsLoadedCount){
    window.customElementsLoadedCount ++
}else {
    window.customElementsLoadedCount = 1
}