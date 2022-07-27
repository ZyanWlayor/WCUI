class Loading extends HTMLElement {
    templateName = 'loading'
    loaderElm = null
    _status =  'loading'
    loadingAnimateElm = null
    successAnimateElm = null
    successAnimateCircleElm = null
    failureAnimateElm = null
    failureAnimateCircleElm = null
    constructor() {
        super()
    }
    static get observedAttributes() {
        return ['successtext', 'failuretext'];
    }
    get status(){
        return this._status
    }
    // attribute change
    attributeChangedCallback(property, oldValue, newValue) {
        console.debug(" ")
        console.debug("======================= % WCUI Debug % =======================")
        console.debug(`%c[WC-Loading #${ this.getAttribute('id') }]`,"color:red;")
        console.debug(`%o`,this)
        console.debug(`property ${ property } from ${ oldValue } to ${ newValue }`)
        console.debug("======================= % WCUI Debug % =======================")
        console.debug(" ")
        if (oldValue === newValue) return;
        this[property] = newValue;

        if (property === 'successtext') {
            this.successTextElm && (this.successTextElm.innerHTML = newValue || '成功！')
        } else if (property === 'failuretext') {
            this.failureTextElm && (this.failureTextElm.innerHTML = newValue || '失败！')
        }
    }
    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' })
        shadow.append(document.getElementById(`${this.templateName}-template`).content.cloneNode(true))

        this.loaderElm = shadow.querySelector('.loader')
        this.loadingAnimateElm = shadow.querySelector('.loading-animate')

        this.successAnimateElm = shadow.querySelector('.success-animate')
        this.successTextElm = shadow.querySelector('.success-animate .success-text')
        this.successAnimateCircleElm = shadow.querySelector('.success-animate .circle-icon')

        this.failureAnimateElm = shadow.querySelector('.failure-animate')
        this.failureTextElm = shadow.querySelector('.failure-animate .failure-text')
        this.failureAnimateCircleElm = shadow.querySelector('.failure-animate .circle-icon')
        // init tips
        this.successTextElm.innerHTML = this.successtext || '成功！'
        this.failureTextElm.innerHTML = this.failuretext || '失败！'
    }
    switchLoading = () => {
        this._status = 'loading'
        this.loaderElm.classList.remove('success', 'failure')
        this.loaderElm.classList.add('loading')
    }
    switchSuccess = () => {
        return new Promise((resolve) => {
            this._status = 'success'
            this.loaderElm.classList.remove('loading', 'failure')
            this.loaderElm.classList.add('success')
            this.successAnimateCircleElm.classList.remove('animate')
            this.successAnimateCircleElm.addEventListener('animationend', () => {
                window.spanner.wait(1000).then(resolve)

            }, {
                once: true
            })
            setTimeout(() => {
                this.successAnimateCircleElm.classList.add('animate')
            })
        })

    }
    switchFailure = () => {
        return new Promise((resolve) => {
            this._status = 'failure'
            this.loaderElm.classList.remove('success', 'loading')
            this.loaderElm.classList.add('failure')
            this.failureAnimateCircleElm.classList.remove('animate')
            this.failureAnimateCircleElm.addEventListener('animationend', () => {
                window.spanner.wait(1000).then(resolve)

            }, {
                once: true
            })
            setTimeout(() => {
                this.failureAnimateCircleElm.classList.add('animate')
            })
        })

    }

}

window.customElements.define('wc-loading', Loading)
if (window.customElementsLoadedCount) {
    window.customElementsLoadedCount++
} else {
    window.customElementsLoadedCount = 1
}