let  authenticationForm = new AuthenticationForm()

document.addEventListener('DOMContentLoaded', (_event) => {
    // DOM loaded ...
    window.spanner.loadWebComponents(['button', 'selector','input','loading','dialog','dateTimePicker']).then(() => {
        document.querySelector('#test-selector').setMenuData([{ value: 'osd', label: 'osd-label' }, { value: 'ASP', label: 'ASP-label' }, { value: 'DJS', label: 'DJS-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }, { value: 'osd', label: 'osd-label' }])
        document.querySelector('#test-button').addEventListener('click', function () {
            console.log(1)
        })
    })

});
window.addEventListener('load', async function () {
    //wait for component loaded
    
})