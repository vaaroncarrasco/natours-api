const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

// * Merge Params
const router = express.Router({ mergeParams: true }); // ? each router has access to the parameter of their specific tours by DEFAULT

// Both routes go to same handler
// POST /tour/4324/reviews
// POST /reviews

router.use(authController.protect);

router.route('/')
    .get(reviewController.getAllReviews)
    .post(authController.restrictTo('user'), reviewController.setTourUserIds, reviewController.createReview);

router.route('/:id')
    .get(reviewController.getReview)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;