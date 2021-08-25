const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

// ? /api/v1/booking

// * Merge Params
const router = express.Router();

router.use(authController.protect);

// dont follow REST CRUD principal -> just for getting checkout session
router.get('/checkout-session/:tourId', authController.protect, bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin', 'lead-guide'));

// Actions that dont need ID
router.route('/').get(bookingController.getAllBookings).post(bookingController.createBooking)

// ID needed actions
router.route('/:id').get(bookingController.getBooking).patch(bookingController.updateBooking).delete(bookingController.deleteBooking);

module.exports = router;