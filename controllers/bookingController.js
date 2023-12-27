const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const Booking = require('./../models/bookingModel');
const AppError = require('./../utils/appError');
const factory = require('./handlerFacotry');
const stripe = require('stripe')(
  'sk_test_51NyH2mSJ7VAuVC4shbENjzlHMUV6McnsRfOlWe0kfV2Oppbelt26mBGqVMa2UU60orGImjgiTyOwh8OmqkA60Vku00ezppgsb5',
);
// const braintree = require('braintree');
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1)Get the current tour id
  const tour = await Tour.findById(req.params.tourId);
  // 2)create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'inr',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });

  // 3)Create session using stripe
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour || !user || !price) return next();
  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
  next();
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

// const gateway = new braintree.BraintreeGateway({
//   environment: braintree.Environment.Sandbox,
//   merchantId: 'qs97p54v9hc5v33q', // process.env.BRAINTREE_MERCHANTID,
//   publicKey: '9vcqr45grmvr4g5h', // process.env.BRAINTREE_PUBLIC_KEY,
//   privateKey: 'f1648792a7cabfef2acd0351bb41128b', // process.env.BRAINTREE_PRIVATE_KEY,
// });
// exports.createBraintreePayment = catchAsync(async (req, res) => {
//   //1)Get the currently booked tour

//   const tour = await Tour.findById(req.params.tourId);
//   const gateway = new braintree.BraintreeGateway({
//     environment: braintree.Environment.Sandbox,
//     merchantId: 'qs97p54v9hc5v33q', // process.env.BRAINTREE_MERCHANTID,
//     publicKey: '9vcqr45grmvr4g5h', // process.env.BRAINTREE_PUBLIC_KEY,
//     privateKey: 'f1648792a7cabfef2acd0351bb41128b', // process.env.BRAINTREE_PRIVATE_KEY,
//   });
//   const user = req.user;

//   //   const paymentMethodNonce = ['card'];

//   // Create a transaction with Braintree
//   const session = gateway.transaction.sale(
//     {
//       amount: tour.price * 89.9, // Amount in INR
//       paymentMethodNonce: 'card',
//       options: {
//         submitForSettlement: true,
//       },

//       customer: {
//         email: user.email,
//       },
//       customFields: {
//         tourId: req.params.tourId,
//       },
//       descriptor: {
//         name: `${tour.name} Tour`,
//         // description: tour.summary,
//         // images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
//         // amount: tour.price * 89.9, // Amount in INR
//         // currency: 'INR',
//         // quantity: 1,
//       },
//     },
//     (err, result) => {
//       if (err) {
//         console.error(err);
//         // Handle the error
//         res.status(500).send('Payment failed');
//       } else if (result.success) {
//         console.log('Transaction ID: ' + result.transaction.id);
//         // Handle the successful transaction
//         res.status(200).json({
//           status: 'success',
//           session,
//         });
//       } else {
//         console.log(result);
//         console.log('Transaction failed. Status: ');
//         // Handle the failed transaction
//         res.status(400).json({
//           status: 'Failure transcation',
//         });
//       }
//     },
//   );
// });
// exports.initialize = (req, res) => {
//   gateway.customer.create(
//     {
//       firstName: 'Muralidhar',
//       lastName: 'Mannem',
//       email: 'muralidharmannam@gmail.com',
//     },
//     (err, result) => {
//       if (err) {
//         res.status(500).send(err);
//         console.log(err);
//       } else {
//         console.log(result);
//         const customer = result.customer;
//         // console.log('Customer ID:', customer.id);
//         res.status(200).json({
//           customerId: result.customer,
//           status: 'success',
//         });
//         // Now you can associate a payment method with this customer
//       }
//     },
//   );
// };
// exports.processPayment = (req, res) => {
//   let { customerId, paymentMethodNonce, amount } = req.body;

//   //   let amountFromTheClient = req.body.amount;
//   gateway.transaction.sale(
//     {
//       amount: amount,
//       customerId: customerId,
//       paymentMethodNonce: paymentMethodNonce,

//       options: {
//         submitForSettlement: true,
//       },
//     },
//     (err, result) => {
//       if (err) {
//         res.status(500).send(err);
//       } else {
//         res.send(result);
//       }
//     },
//   );
// };
