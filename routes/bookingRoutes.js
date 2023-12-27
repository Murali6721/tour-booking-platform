const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authContoller = require('../controllers/authContoller');
const router = express.Router();

router.use(authContoller.protect);
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(authContoller.restrictTo('admin', 'lead-guide'));
router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);
// router.get('/initializeBraintree', bookingController.initialize);
// router.post('/confirmBraintree', bookingController.processPayment);

module.exports = router;
