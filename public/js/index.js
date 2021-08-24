/* eslint-disable */
// * Note: Bundle index.js file (containing multiple js files exports) into one bundled file with parcel/webpack
// Note: mapbox npm module doesnt work with parcel, so use the cdn

import '@babel/polyfill'; // to be included in bundle to make js features run in old browsers
import { displayMap } from './mapbox';
import { login, logout } from './login'; // from file
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// * We bring code-parts from file that interact with frontend to index.js to make the functions work well

// DOM ELEMENTS // get id/class element // if falsy ...
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// DELEGATION
if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}

if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });
}

if (userDataForm) {
    userDataForm.addEventListener('submit', e => {
        e.preventDefault();

        // Recreating enctype=multipart/formdata programmaticaly
        const form = new FormData(); // * Web API Web Workers -> new FormData() -> instance{}
        form.append('name', document.getElementById('name').value); // name / value
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);
        console.log(form);

        updateSettings(form, 'data');
    });
}

if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async e => {
        e.preventDefault();

        // we use .textContent to change html text content value
        document.querySelector('btn--save-password').textContent = 'Updating...';

        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;

        await updateSettings({passwordCurrent, password, passwordConfirm}, 'password');

        document.querySelector('btn--save-password').textContent = 'Save password';

        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    });
}

if (bookBtn)
    bookBtn.addEventListener('click', e => {
        e.target.textContent = 'Processing...'
        const { tourId } = e.target.dataset;
        bookTour(tourId); // from stripe.js which calls the api endpoint w/ axios
    });