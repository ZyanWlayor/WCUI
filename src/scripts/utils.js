// base class for authentication
class AuthenticationForm {
    _formElements = []
    registerFormElement(formElement){
        this._formElements.push(formElement)
    }
    clearForm(){
        this._formElements.forEach(elm=>{
            elm.clear()
        })
    }
    reset(){
        this._formElements = []
    }
    getValueByFieldName(fieldName){
        const field = this._formElements.filter(e=>e.name === fieldName)
        if(field.length){
            return field[0].value
        }else {
            return undefined
        }
    }
    isValid(){
        this._formElements.forEach(e=>e.validate())
        return this._formElements.every(e=>(e.validated))
    }
}