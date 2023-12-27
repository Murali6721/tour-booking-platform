const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const APIFeatures = require('../utils/apiFeatures');

const createSendToken = (user, statusCode, req, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_TOKEN, {
    expiresIn: process.env.EXPIRES_IN,
  });

  const cookiesOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    // secure: req.secure || req.header('x-forwarded-proto') === 'https',
  };
  // if (secure) cookiesOptions.secure = true;

  res.cookie('jwt', token, cookiesOptions);
  // removing password
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  //2.If user exist then check password is correct or not.
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    return next(new AppError('User already with exist email', 401)); //UnAuthorised
  }
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1.Check given credentials are exist in the database
  if (!email || !password) {
    next(new AppError('Provide name and passoword details for login', 400));
  }

  //2.If user exist then check password is correct or not.
  const user = await User.findOne({ email: email }).select('+password');
  const isPasswordCorrect = await user.correctPassword(password, user.password);

  if (!user || !isPasswordCorrect) {
    return next(new AppError('Incorrect email or password', 401)); //UnAuthorised
  }

  // 3. IF everything OK, Send token to client
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1.Getting token and check if it's available or not
  const isAutorized = req.headers.authorization;
  if (isAutorized && isAutorized.startsWith('Bearer')) {
    token = isAutorized.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('you are not logged in! pease Login to see details', 401),
    );
  }

  //2.Verification of the token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_TOKEN,
  );

  // 3.Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('User belong to this token no longer exist!', 401),
    );
  }

  // 4.Check if user changed password after token issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User changed password recently ! please login again', 401),
    );
  }

  //Grant ACCESS to PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET_TOKEN,
      );

      // 2.Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3.Check if user changed password after token issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action ", 403),
      );
    }

    next();
  };
};

// when user forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //  1)Get user based on Posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('There is no user with provide email address', 404),
    );
  }

  //  2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //  3)sent it to user's email

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users.resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'successs',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an Error sending email. Try Again later!', 500),
    );
  }
});

// when user wants to reset  password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get User based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2)If token has not expired , and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save(); // we don't validate here
  // 3)Update changePasswordat property for the user

  // 4) Log the user in , send JWT
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1)Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2)Check id Posted current password is correct
  const isPasswordCorrect = await user.correctPassword(
    req.body.passwordCurrent,
    user.password,
  );
  if (!isPasswordCorrect) {
    return next(new AppError('Your current password is Incorrect.', 401));
  }
  // 3)If so,update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4)Log user in, send JWT
  createSendToken(user, 200, req, res);
});
