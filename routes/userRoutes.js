const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

// URL is literally the action being performed
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout); // * .get() cause we are not posting data, we are getting a cookie that overwrites
router.post('/forgotPassword', authController.forgotPassword); // 1) only receives email address
router.patch('/resetPassword/:token', authController.resetPassword); // 2) receives token and new password // * Path === Update

// ? Protect routes by using a middleware that comes before all other routes as middlewares run in sequence
router.use(authController.protect);

// authController.protect puts user in req.body and passes it to authController.updatePassword
router.patch('/updateMyPassword', authController.updatePassword); // * PATCH - change/manipulate data

router.get('/me', userController.getMe, userController.getUser);

// * upload.single('form-field-name') -> single() uploading single img
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);

router.delete('/deleteMe', userController.deleteMe); // * eventhough we aint deleting per se, still use HTTP DELETE METHOD

// ? Protect routes by using a middleware that comes before all other routes as middlewares run in sequence
router.use(authController.restrictTo('admin'));

// REST Philosopy: URL has nothing to do with the action being performed
router.route('/').get(userController.getAllUsers).post(userController.createUser);
router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);

module.exports = router;
