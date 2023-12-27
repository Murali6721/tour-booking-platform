const express = require('express');
const tourController = require('./../controllers/tourController');
const authContoller = require('./../controllers/authContoller');

const router = express.Router();
// const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');

// router.param('id', tourController.checkId);

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.allias, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authContoller.protect,
    authContoller.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getTourWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authContoller.protect,
    authContoller.restrictTo('admin', 'lead-guide'),
    tourController.checkBody,
    tourController.postNewTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authContoller.protect,
    authContoller.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeToueImages,
    tourController.updateTour,
  )
  .delete(
    authContoller.protect,
    authContoller.restrictTo('admin', 'lead-guide'),
    tourController.removeTour,
  );

module.exports = router;
