import axios from "axios";
import { showAlert } from './alert'; // file export

const stripe = Stripe('pk_test_51JR3FBDyTKJqXcAHZAl4tVP1DaYu4KIfOLB6RUQleLAE3opzKN8b3h43hhidkMTD2RcCLJMn97LX88ZGryGJUPNX00m3UPGoMn');

export const bookTour = async tourId => {
    try { // async/await code goes in try/catch
        // 1) Get checkout session from api endpoint
        const session = await axios(`/api/v1/booking/checkout-session/${tourId}`);

        // 2) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch (err) {
        console.log(err);
        showAlert('error', err)
    }
}
