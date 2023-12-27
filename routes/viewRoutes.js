const express = require('express');
const viewController = require('./../controllers/viewsController');
const authContoller = require('./../controllers/authContoller');
const bookingController = require('./../controllers/bookingController');
const router = express.Router();

router.get(
  '/',
  bookingController.createBookingCheckout,
  authContoller.isLoggedIn,
  viewController.getOverView,
);

router.get('/tour/:slug', authContoller.isLoggedIn, viewController.getTour);
router.get('/login', authContoller.isLoggedIn, viewController.getLoginForm);
router.get('/signup', viewController.getSignupForm);
router.get('/me', authContoller.protect, viewController.getAccount);
router.get('/my-tours', authContoller.protect, viewController.getMytours);

router.post(
  '/submit-user-data',
  authContoller.protect,
  viewController.updateUserData,
);

module.exports = router;
