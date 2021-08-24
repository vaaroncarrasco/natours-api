/* eslint-disable */

export const hideAlert = () => {
    const el  = document.querySelector('.alert'); // get alert box
    if (el) el.parentElement.removeChild(el); // if alert exists, remove it
}

// type is 'success' or 'error'
export const showAlert = (type, msg) => {
    hideAlert(); // wipe prev alerts just in case
    const markup = `<div class="alert alert--${type}">${msg}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup); // insert inside the body right at the beginning
    window.setTimeout(hideAlert, 5000);
}