const FILE_SELECTOR_TYPE = {
    file:'file',
    directory:'directory'
}

class WCFileSelector extends HTMLElement {
    mode = FILE_SELECTOR_TYPE.file

    constructor(){
     super()   
    }

    static get observedAttributes() {
        return [
            'type',
        ]
    }
    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue){
            return
        }
        this[property] = newValue
    }
}

window.customElements.define('wc-fileselector', WCFileSelector)
if (window.customElementsLoadedCount) {
    window.customElementsLoadedCount++
} else {
    window.customElementsLoadedCount = 1
}