const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authContoller = require('../controllers/authContoller');
const router = express.Router({ mergeParams: true });

router.use(authContoller.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authContoller.restrictTo('user', 'admin'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authContoller.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  )
  .patch(
    authContoller.restrictTo('user', 'admin'),
    reviewController.updateReview,
  );

module.exports = router;
