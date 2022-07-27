const DATETIMEPICKER_TYPE = [
    'date',
    'time',
    'datetime'
]
const DATETIMEPICKER_PICKER = [
    'date',
    'time'
]
const DATETIMEPICKER_SIZE = [
    'normal',
    'small',
    'big'
]
function checkDateValid(d) {
    let date = new Date(d)
    if (date.toString() !== 'Invalid Date') {
        return date
    }
}
function checkDatePickerRange(r) {
    let start, end
    if (typeof r === 'string') {
        [start, end] = r.split('-')
    } else if (Array.isArray(r)) {
        [start, end] = r
    }

    start = checkDateValid(start)
    end = checkDateValid(end)
    if (start && end && end > start) {
        return [start, end]
    } else {
        return false
    }
}
function getCountDays(date) {
    let curDate = new Date(date)
    curDate.setDate(32)
    return 32 - curDate.getDate()
}
// get first day of this month day
function getStartDay(date) {
    let d = new Date(date)
    d.setDate(1)
    return d.getDay()
}
class WCDateTimePicker extends HTMLElement {
    templateName = 'dateTimePicker'

    _size = 'normal'
    _value = null // current selected date
    _datePickerValue = null // current display date for date picker
    _type = 'date'
    _pickers = []
    _picker = null
    _animating = false
    _opened = false
    _range = null            // range for select date and time, two element tuple like [ {Date},{Date} ] for date or datetime picker, [ {string},{string} ] for time picker

    inputMainElm = null
    inputElm = null
    tabbarElm = null
    tabbarDateElm = null
    pickerPanelElm = null
    nextYearControlElm = null
    prevYearControlElm = null
    nextMonthControlElm = null
    prevMonthControlElm = null
    datePickerBodyElm = null
    controlsElm = null

    timePickerHourElm = null
    timePickerMinuteElm = null
    timePickerHourAddElm = null
    timePickerHourRedElm = null
    timePickerMinuteAddElm = null
    timePickerMinuteRedElm = null

    formElement = null

    set size(v){
        if(DATETIMEPICKER_SIZE.indexOf(v) && !this._setSizeFlag){
            this._size = v
            this._setSizeFlag = true
        }
    }
    get size(){
        return this._size
    }
    set type(val = 'date') {
        // support set once
        if (DATETIMEPICKER_TYPE.indexOf(val) !== -1 && !this._typeSetFlag) {
            this._typeSetFlag = true
            this._type = val
        }
    }
    get type() {
        return this._type
    }
    set value(val) {
        let date = checkDateValid(val)
        // check if in range
        if (this.range && (this.range[0] > date || this.range[1] < date)) {
            return
        }
        if (date) {
            this._value = date
            if(this.formElement){
                this.formElement.value = this.value
            }
            this.dispatchEvent(new CustomEvent('DateChange', { detail: this._value }))
        }
    }
    get value() {
        if (this._value) {
            return this._value
        } else if (this.range) {
            return this.range[0]
        } else {
            return new Date()
        }
    }
    setDate(val) {
        this.value = val
    }
    set datePickerValue(v) {
        let d = checkDateValid(v)
        this._datePickerValue = d
        this.dispatchEvent(new CustomEvent('DatePickerValueChange'))
    }
    get datePickerValue() {
        return this._datePickerValue || this.value
    }
    set range(r) {
        console.log(this.type)
        if(this._setRangeFlag){
            return
        }
        this._setRangeFlag = true
        r = checkDatePickerRange(r)
        if (r) {
            this._range = r
        }
    }
    get range() {
        return this._range
    }
    constructor() {
        super()
    }
    static get observedAttributes() {
        return [
            'type',
            'range',
            'value',
            'size',
            'name',
            'form'         
        ];
    }
    attributeChangedCallback(property, oldValue, newValue) {
        console.debug(" ")
        console.debug("======================= % WCUI Debug % =======================")
        console.debug(`%c[WC-DatetimePicker #${this.getAttribute('id')}]`, "color:red;")
        console.debug(`%o`, this)
        console.debug(`property ${property} from ${oldValue} to ${newValue}`)
        console.debug("======================= % WCUI Debug % =======================")
        console.debug(" ")
        if (oldValue === newValue) return;
        this[property] = newValue;

    }

    connectedCallback() {
        // init first picker
        switch (this._type) {
            case 'date':
                this._pickers = ['date']
                break;
            case 'time':
                this._pickers = ['time']
                break;
            case 'datetime':
                this._pickers = ['date', 'time']
                break;
        }
        this._picker = this._pickers[0]

        const shadow = this.attachShadow({ mode: 'open' })
        shadow.append(document.getElementById(`${this.templateName}-template`).content.cloneNode(true))

        this.inputMainElm = shadow.querySelector('.input')
        this.pickerPanelElm = shadow.querySelector('.picker-panel')

        this.inputElm = shadow.querySelector('.input input')
        this.tabbarElm = shadow.querySelector('.datetime-tabbar')
        this.tabbarDateElm = this.tabbarElm.querySelector('.date.tab')

        this.nextYearControlElm = shadow.querySelector('.controls .year-next')
        this.prevYearControlElm = shadow.querySelector('.controls .year-prev')
        this.nextMonthControlElm = shadow.querySelector('.controls .month-next')
        this.prevMonthControlElm = shadow.querySelector('.controls .month-prev')

        this.datePickerBodyElm = shadow.querySelector('.date-picker.picker .picker-body')

        this.timePickerHourAddElm = shadow.querySelector('.time-picker .hour-selector .add')
        this.timePickerHourRedElm = shadow.querySelector('.time-picker .hour-selector .reduce')
        this.timePickerMinuteAddElm = shadow.querySelector('.time-picker .minute-selector .add')
        this.timePickerMinuteRedElm = shadow.querySelector('.time-picker .minute-selector .reduce')

        this.timePickerHourElm = shadow.querySelector('.time-picker .hour-selector .hour')
        this.timePickerMinuteElm = shadow.querySelector('.time-picker .minute-selector .minute')

        this.controlsElm = shadow.querySelector('.controls')

        shadow.querySelector('.dateTimePicker').classList.add(`dateTimePicker-${ this.size }`)

        this.pickerPanelElm.addEventListener('animationend', () => {
            if (this._opened) {
                this.pickerPanelElm.classList.add('opened')
                this.pickerPanelElm.classList.remove('open-animate')
            } else {
                this.dispatchEvent(new CustomEvent('Close'))
                this.datePickerValue = this.value
                this.pickerPanelElm.classList.remove('open', 'opened', 'close-animate')
            }
            this._animating = false
        })

        this._setPickerTab()

        // react value display
        this._updateDate()
        this.addEventListener('DateChange', () => {
            this.datePickerValue = this.value
        })
        this.addEventListener('DatePickerValueChange', () => {
            this._updateDate()
            this._renderDatePicker()
        })

        this._setUpControls()

        this._setUpTimePicker()

        this.inputMainElm.addEventListener('click', () => {
            // open picker panel
            this._togglePickerPanel()
        })
        document.body.addEventListener('click', this._outerClickHide)

        // connect to form
        if( this.name && this.form && window[this.form]){
            this.formElement = {
                name: this.name,
                validated: true,
                value: this.value,
                errorMsg: '',
                clear:()=>{
                    this.value = new Date()
                },
                validate:()=>{
                    return true
                }
            }
            window[this.form].registerFormElement(this.formElement)
        }
    }
    // when click outer space hide panel
    disconnectedCallback() {
        document.body.removeEventListener('click', this._outerClickHide)
    }
    _outerClickHide = (e) => {
        if (e.target !== this) {
            console.debug(`[WC-DatetimePicker] outer click`)
            this._closePickerPanel()
        }
    }
    _togglePickerPanel() {
        if (this._opened) {
            this._closePickerPanel()
        } else {
            this._openPickerPanel()
        }
    }
    _openPickerPanel = () => {
        if (this._animating || this._opened) return
        this.pickerPanelElm.classList.add('open')
        this._animating = true
        this._opened = true
        this.dispatchEvent(new CustomEvent('Open'))
        // set first picker
        this._switchPicker()
        setTimeout(() => {
            this.pickerPanelElm.classList.add('open-animate')
        }, 0)
        this._renderDatePicker()
    }
    _closePickerPanel = () => {
        if (this._animating || !this._opened) return
        this._opened = false
        this._animating = true
        setTimeout(() => {
            this.pickerPanelElm.classList.add('close-animate')
        }, 0)
    }
    _updateDate() {
        if (this.inputElm) {
            let f;
            switch (this.type) {
                case 'date':
                    f = 'yyyy MM/dd'
                    break;
                case 'datetime':
                    f = 'yyyy MM/dd hh:mm'
                    break;
                case 'time':
                    f = 'hh:mm'
                    break;
                default:
                    f = 'yyyy MM/dd'
            }
            this.inputElm.value = window.spanner.dateTimeFormat(this.value, f)
            this.tabbarDateElm.innerHTML = window.spanner.dateTimeFormat(this.datePickerValue, 'yyyy 年 MM 月')
            this.timePickerHourElm.innerHTML = window.spanner.dateTimeFormat(this.value, 'hh')
            this.timePickerMinuteElm.innerHTML = window.spanner.dateTimeFormat(this.value, 'mm')
        }
    }
    _nextYear() {
        const d = new Date(this.datePickerValue)
        this.datePickerValue = new Date(d.setFullYear(d.getFullYear() + 1))

    }
    _prevYear() {
        const d = new Date(this.datePickerValue)
        this.datePickerValue = new Date(d.setFullYear(d.getFullYear() - 1))

    }
    _nextMonth() {
        const d = new Date(this.datePickerValue)
        this.datePickerValue = new Date(d.setMonth(d.getMonth() + 1, 1))
    }
    _prevMonth() {
        const d = new Date(this.datePickerValue)
        this.datePickerValue = new Date(d.setMonth(d.getMonth() - 1, 1))
    }
    _prevHour() {
        if (this.value.getHours() > 0) {
            this.value = new Date(this.value.setHours(this.value.getHours() - 1))
        }
    }
    _nextHour() {
        if (this.value.getHours() < 23) {
            this.value = new Date(this.value.setHours(this.value.getHours() + 1))
        }
    }
    _prevMinute() {
        if (this.value.getMinutes() > 0) {
            this.value = new Date(this.value.setMinutes(this.value.getMinutes() - 1))
        }
    }
    _nextMinute() {
        if (this.value.getMinutes() < 59) {
            this.value = new Date(this.value.setMinutes(this.value.getMinutes() + 1))
        }
    }
    _setUpControls() {
        this.nextYearControlElm.addEventListener('click', () => {
            this._nextYear()
        })
        this.prevYearControlElm.addEventListener('click', () => {
            this._prevYear()
        })
        this.nextMonthControlElm.addEventListener('click', () => {
            this._nextMonth()
        })
        this.prevMonthControlElm.addEventListener('click', () => {
            this._prevMonth()
        })
    }
    _setPickerTab() {
        const underlineElm = document.createElement('i')
        underlineElm.className = 'underline'
        const tabbarElm = this.tabbarElm
        tabbarElm.appendChild(underlineElm)
        // get available pickers
        const availableTabs = Array.from(tabbarElm.querySelectorAll('.tab')).filter(e => {
            if (this._pickers.indexOf(e.dataset.picker) !== -1) {
                return true
            } else {
                // hide unreachable picker
                e.style.display = 'none'
                return false
            }
        })
        const underlineTraceElm = (elm, animate = true) => {
            // calc left value and width

            let bd = elm.getBoundingClientRect()
            let left_val = bd.left - tabbarElm.getBoundingClientRect().left
            let width_val = bd.width

            underlineElm.style.width = width_val + 'px'
            underlineElm.style.left = left_val + 'px'
            if (animate) {
                underlineElm.style.transition = 'width .3s ease-in-out,left .3s ease-in-out'
            } else {
                underlineElm.style.transition = ''
            }

        }
        const switchTab = (tabElm, animate = true) => {
            underlineTraceElm(tabElm, animate)
            availableTabs.forEach(t => t.classList.remove('active'))
            tabElm.classList.add('active')
            this._switchPicker(tabElm.dataset.picker, true)
        }
        // init underline
        availableTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // calc left value and width
                switchTab(tab)

            })
        })
        this.addEventListener('Open', function () {
            switchTab(availableTabs[0], false)
        })
    }

    _switchPicker(picker, isAnimate = false) {
        if (this._animating && isAnimate) return

        // if not date picker,hide controls for date
        if ((picker || this._pickers[0]) !== 'date') {
            this.controlsElm.classList.add('hide')
        } else {
            this.controlsElm.classList.remove('hide')
        }

        // close current picker
        const curPickerElm = this.shadowRoot.querySelector(`.picker.${this._picker}-picker`)
        // open next picker
        this._picker = picker || this._pickers[0]
        const nextPickerElm = this.shadowRoot.querySelector(`.picker.${picker || this._pickers[0]}-picker`)
        if (isAnimate) {
            this._animating = true
            if (curPickerElm === nextPickerElm) {
                this._animating = false

            } else {
                return Promise.all([this._animateOpen(nextPickerElm), this._animateClose(curPickerElm)]).then(() => {
                    this._animating = false
                })
            }

        } else {
            // a quick switch to picker
            if (curPickerElm !== nextPickerElm) {
                curPickerElm.classList.remove('open', 'opened')
                curPickerElm.classList.add('close', 'closed')
            }
            nextPickerElm.classList.remove('close', 'closed')
            nextPickerElm.classList.add('open', 'opened')
        }


    }
    _animateOpen(elm) {
        return new Promise((resolve) => {
            elm.addEventListener('animationend', () => {
                this._animating = false
                elm.classList.remove('animate-open')
                elm.classList.add('opened')
                resolve()
            }, {
                once: true
            })
            elm.classList.remove('close', 'closed')
            elm.classList.add('open')
            setTimeout(() => {
                elm.classList.add('animate-open')
            }, 0)
        })

    }
    _animateClose(elm) {
        return new Promise((resolve) => {
            elm.addEventListener('animationend', () => {
                this._animating = false
                elm.classList.remove('animate-close')
                elm.classList.remove('open', 'opened')
                elm.classList.add('closed')
                resolve()
            }, {
                once: true
            })
            elm.classList.remove('open', 'opened')
            elm.classList.add('close')
            setTimeout(() => {
                elm.classList.add('animate-close')
            }, 0)

        })
    }

    _renderDatePicker() {
        // get prev month days and the day of first day
        let p_m_d = new Date(this.datePickerValue)
        let curMonthDays = getCountDays(p_m_d)
        p_m_d.setMonth(p_m_d.getMonth() - 1, 1)
        let prevMonthDays = getCountDays(p_m_d)

        let startDay = getStartDay(this.datePickerValue)

        // calc range param
        let range_date_params = null
        if(this.range){
            let prev_range_day = new Date(this.range[0])
            prev_range_day.setDate(prev_range_day.getDate() - 1)
            prev_range_day.setHours(23)
            prev_range_day.setMinutes(59)

            let next_range_day = new Date(this.range[1])
            next_range_day.setDate(next_range_day.getDate() + 1)
            next_range_day.setHours(0)
            next_range_day.setMinutes(0)

            range_date_params = [prev_range_day,next_range_day]
        }

        // render prev month days
        const p_m_d_days = getCountDays(p_m_d)
        this.datePickerBodyElm.innerHTML = ''

        for (let d = 0; d < startDay; d++) {
            const prevMDay = document.createElement('div')
            prevMDay.classList.add('prev-month-day')
            let day = new Date(p_m_d)
            day.setHours(23)
            day.setMinutes(59)
            day.setDate((p_m_d_days - startDay + d + 1))

            prevMDay.addEventListener('click', () => {
                let value = new Date(p_m_d)
                value.setHours(this.value.getHours())
                value.setMinutes(this.value.getMinutes())
                value.setDate(day.getDate())
                this.value = value

            })
            if (this.value.getFullYear() === day.getFullYear() && this.value.getMonth() === day.getMonth()  && this.value.getDate() === day.getDate()) {
                prevMDay.classList.add('active')
            }
            if(range_date_params && !(day > range_date_params[0] && day < range_date_params[1])){
                prevMDay.classList.add('disabled')
            }

            prevMDay.innerHTML = `${prevMonthDays - startDay + d + 1}`
            this.datePickerBodyElm.appendChild(prevMDay)
        }

        // render current month days
        for (let d = 0; d < curMonthDays; d++) {
            const curMDay = document.createElement('div')
            curMDay.classList.add('cur-month-day')
            let day = new Date(this.datePickerValue)
            day.setHours(23)
            day.setMinutes(59)
            day.setDate(d + 1)

            curMDay.addEventListener('click', () => {
                let value = new Date(this.datePickerValue)
                value.setDate(day.getDate())
                value.setHours(this.value.getHours())
                value.setMinutes(this.value.getMinutes())
                this.value = value
            })
            if (this.value.getFullYear() === this.datePickerValue.getFullYear() && this.value.getMonth() === this.datePickerValue.getMonth() && this.value.getDate() === (d + 1)) {
                curMDay.classList.add('active')
            }
            if(range_date_params && !(day > range_date_params[0] && day < range_date_params[1])){
                curMDay.classList.add('disabled')
            }

            curMDay.innerHTML = `${d + 1}`
            this.datePickerBodyElm.appendChild(curMDay)
        }
        // render next month days
        for (let d = 1; d <= 7 - (startDay + curMonthDays) % 7; d++) {
            const nextMDay = document.createElement('div')
            nextMDay.classList.add('next-month-day')
            const day = new Date(this.datePickerValue)
            day.setMonth(day.getMonth() + 1, 1)
            day.setHours(23)
            day.setMinutes(59)
            day.setDate(d)
            if (this.value.getFullYear() === day.getFullYear() && this.value.getMonth() === day.getMonth() && this.value.getDate() === d) {

                nextMDay.classList.add('active')
            }
            if(range_date_params && !(day > range_date_params[0] && day < range_date_params[1])){
                nextMDay.classList.add('disabled')
            }
            nextMDay.addEventListener('click', () => {
                let value = new Date(day)
                value.setDate(d)
                value.setHours(this.value.getHours())
                value.setMinutes(this.value.getMinutes())
                this.value = value
            })
            nextMDay.innerHTML = `${d}`
            this.datePickerBodyElm.appendChild(nextMDay)
        }

    }
    _setUpTimePicker() {
        this.timePickerHourAddElm.addEventListener('click', () => {
            this._nextHour()
        })
        this.timePickerHourRedElm.addEventListener('click', () => {
            this._prevHour()
        })
        this.timePickerMinuteAddElm.addEventListener('click', () => {
            this._nextMinute()
        })
        this.timePickerMinuteRedElm.addEventListener('click', () => {
            this._prevMinute()
        })
    }
}


window.customElements.define('wc-datetimepicker', WCDateTimePicker)

if (window.customElementsLoadedCount) {
    window.customElementsLoadedCount++
} else {
    window.customElementsLoadedCount = 1
}