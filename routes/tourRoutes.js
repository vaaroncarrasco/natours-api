const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');

// * Import router to do route nesting instead
const reviewRouter = require('./reviewRoutes');

const router = express.Router(); // router is a middleware

// ? Mounting router -> nested routes
router.use('/:tourId/reviews', reviewRouter); // * for this route '' .use() -> reviewRouter instead

// router.param('id', tourController.checkID);
//                               run this middleware firs,     then this middleware
router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);
router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);

// * Geospatial Queries: Finding tours within radius
// /tours-within?distance=233&center=-40,45&unit=mi // - UGLY WAY
// /tours-within/233/center/-40,45/unit/mi // CLEAN WAY
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router.route('/')
    .get(tourController.getAllTours)
    .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);


router.route('/:id')
    .get(tourController.getTour)
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour
    );


module.exports = router;