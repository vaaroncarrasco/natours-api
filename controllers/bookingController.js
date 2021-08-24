// require('stripe') returns a function which is given the secret key as param
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // * returns stripe{} w/ methods
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');

exports.getCheckoutSession = catchAsync( async(req, res, next) => {
    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        // * from checkout stripe api's to succesful url w/ query params
        // https://www.natours.dev/?tour=234873428&user=68732468234&price=497
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email, // users email -> unique -> to get data to create booking in db
        client_reference_id: req.params.tourId, // tour id -> unique -> to get data to create booking in db
        line_items: [
            {
                name:`${tour.name} Tour`,
                description: tour.summary,
                images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                amount: tour.price * 100, // expected to be in cents
                currency: 'usd',
                quantity: 1
            }
        ]
    });

    // 3) Create session as response
    res.status(200).json({
        status: 'success',
        session
    });
});

// * First middleware to hit when home '/' to check if it has the query previously set params when booking
// createBookingCheckout -> isLoggedIn -> getOverview
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    //! Temporary cause it is insecure
    // https://www.natours.dev/?tour=234873428&user=68732468234&price=497
    const { tour, user, price } = req.query;

    if (!tour && !user && !price) return next(); // move to midware -> isLoggedIn -> getOverview

    // * Creating Booking document in DB
    await Booking.create({ tour, user, price });

    // https://www.natours.dev/   ?   tour=234873428&user=68732468234&price=497
    res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
