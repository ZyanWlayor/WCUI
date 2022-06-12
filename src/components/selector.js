const SELECTOR_TYPE = [
    'selector-primary',
    'selector-seconary',
];
const SELECTOR_SIZE = [
    'small','normal','big'
]
class WCSelector extends HTMLElement {
    templateName = 'selector'
    value = null
    mainElm = null
    inputElm = null
    menuElm = null
    menuListElm = null
    arrowElm = null
    _menuData = null
    _status = 0 // 0.menu closed 1.menu opened
    _animating = false
    constructor() {
        super()
    }
    static get observedAttributes() {
        return ['type', 'size'];
    }
    // attribute change
    attributeChangedCallback(property, oldValue, newValue) {
        console.debug(" ")
        console.debug("======================= % WCUI Debug % =======================")
        console.debug(`%c[WC-Selector #${ this.getAttribute('id') }]`,"color:red;")
        console.debug(`%o`,this)
        console.debug(`property ${ property } from ${ oldValue } to ${ newValue }`)
        console.debug("======================= % WCUI Debug % =======================")
        console.debug(" ")
        if (oldValue === newValue) return;
        this[property] = newValue;
        switch(property){
            case 'size':
                this._setSelectorSize(newValue)
                break;
            case 'type':
                this._setSelectorType(newValue)
                break;
            default:
                return;
        }
    }
    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' })
        shadow.append(document.getElementById(`${this.templateName}-template`).content.cloneNode(true))

        this.mainElm = this.shadowRoot.querySelector('.selector')
        this.inputElm = this.shadowRoot.querySelector('input')
        this.menuElm = this.shadowRoot.querySelector('.menu')
        this.menuListElm = this.menuElm.querySelector('.menu-list')
        this.arrowElm = this.shadowRoot.querySelector('.arrow')
        this.mainElm.addEventListener('click', this._click)
        this.menuElm.addEventListener('transitionend', this._menuListTransitionEnd)
        document.documentElement.addEventListener('click',this._autoClose)

        this._setSelectorSize(this.size)
        this._setSelectorType(this.type)
        this._setNoMenuData()
    }
    disconnectedCallback(){
        document.documentElement.removeEventListener('click',this._autoClose)
    }
    // set size of this selector
    _setSelectorSize(size = 'normal'){
        if(this.mainElm){
            this.mainElm.classList.remove(...SELECTOR_SIZE.map(size=>`selector-${size}`))
            this.mainElm.classList.add(`selector-${size}`)
        }
    }
    // set type of this selector
    _setSelectorType(type = 'primary'){
        if(this.mainElm){
            this.mainElm.classList.remove(...SELECTOR_SIZE.map(size=>`selector-${type}`))
            this.mainElm.classList.add(`selector-${type}`)
        }
    }
    // auto close menu when click other space
    _autoClose=()=> {
        if (this._animating) {
            return
        }
        if (this._status) {
            // close menu
            this._status = 0
            this._animating = true
            this.menuListElm.classList.remove('animate-open')
            this.arrowElm.classList.remove('animate-open')
        }
    }
    _menuListTransitionEnd = () => {
        if (this._status) {
            //reach open animation end
            this._animating = false
        } else {
            //reach close animation end
            this.inputElm.classList.remove('status-opened')
            this.menuElm.classList.remove('status-opened')
            this._animating = false
        }
    }
    // main element clicked
    _click = (_event) => {
        if (this._animating) {
            return
        }
        if (this._status) {
            // close menu
            this._status = 0
            this._animating = true
            this.menuListElm.classList.remove('animate-open')
            this.arrowElm.classList.remove('animate-open')

        } else {
            // open menu
            this._status = 1
            this._animating = true
            this.inputElm.classList.add('status-opened')
            this.menuElm.classList.add('status-opened')
            setTimeout(() => {
                this.menuListElm.classList.add('animate-open')
                this.arrowElm.classList.add('animate-open')
            }, 0)
        }
    }
    /**
     * @description set menu data for this selector,data struct like 
     * {
     *      value:{Any}             menu value for data transfer inner
     *      label:{String}              menu value for user select visable
     * }
     * 
     *  @param {object} menuData data struct to generate and fill menu
     *  @return {void}
     */
    setMenuData(menuData) {
        // check if a valid menu data
        let isValid = Array.isArray(menuData) && menuData.every(menuItem => ((menuItem.label !== undefined) && (menuItem.value !== undefined)))
        this._menuData = menuData
        if (isValid && menuData.length) {
            // regenerate menu struct
            this.menuElm.innerHTML = ''
            let menuUlElm = document.createElement('ul')
            menuUlElm.classList.add('menu-list')
            for (let menuItem of menuData) {
                let menuItemElm = document.createElement('li')
                menuItemElm.innerHTML = menuItem.label.toString()
                menuItemElm.setAttribute('data-value', menuItem.value)
                menuItemElm.addEventListener('click',()=>{
                    this.value = menuItem.value
                    this.inputElm.value = menuItem.label.toString()
                    this.menuListElm.querySelectorAll('li').forEach(i=>{
                        i.classList.remove('active')
                    })
                    menuItemElm.classList.add('active')
                    // emit select event
                    const event = new CustomEvent("select", {"detail":menuItem})
                    this.dispatchEvent(event)
                })
                menuUlElm.appendChild(menuItemElm)
            }
            
            this.menuElm.append(menuUlElm)
            this.menuListElm = menuUlElm
            // set first node as actived item
            const clickEvent = new Event('click')
            this.menuListElm.children[0].dispatchEvent(clickEvent)

        } else if(isValid){
            // deal with empty list []
            this._setNoMenuData()
        }else {
            console.error(`[WC-Selector] setMenuData get a wrong menuData`)
        }
    }
    _setNoMenuData(){
        this.menuElm.innerHTML = ''
            let menuUlElm = document.createElement('ul')
            menuUlElm.classList.add('menu-list')
            let menuItemEmptyElm = document.createElement('li')
            menuItemEmptyElm.innerHTML = '无选项'
            // clear selected item
            this.value = ''
            this.inputElm.value = '无选项'
            menuUlElm.appendChild(menuItemEmptyElm)
            this.menuElm.append(menuUlElm)
            this.menuListElm = menuUlElm
    }
}

window.customElements.define('wc-selector', WCSelector)
if(window.customElementsLoadedCount){
    window.customElementsLoadedCount ++
}else {
    window.customElementsLoadedCount = 1
}