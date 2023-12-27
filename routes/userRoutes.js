const express = require('express');
const multer = require('multer');
const userController = require('./../controllers/userController');
const authContoller = require('./../controllers/authContoller');
const AppError = require('../utils/appError');
const reviewController = require('./../controllers/reviewController');
const router = express.Router();

//signup,login,reset password,
router.post('/signup', authContoller.signup);
router.post('/login', authContoller.login);
router.get('/logout', authContoller.logout);
router.post('/forgotPassword', authContoller.forgotPassword);
router.patch('/resetPassword/:token', authContoller.resetPassword);

router.use(authContoller.protect); //Important

router.patch('/updateMyPassword', authContoller.updatePassword);

// about us
router.get('/me', userController.getMe, userController.getUser);

// Deleting user
router.delete('/deleteMe', userController.deleteMe);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,userController.resizePhoto,
  userController.updateMe,
);

router.use(authContoller.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.postNewUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.removeUser);

module.exports = router;
