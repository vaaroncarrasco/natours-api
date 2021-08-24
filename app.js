const path = require('path'); // core module to manipulate path names
const express = require('express');
const morgan = require('morgan'); // variable/package same name convention
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// * Cookie parser: parse cookies from incomming reqs
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes'); // each router is in one diff file - each of them is one small sub application
const userRouter = require('./routes/userRoutes'); // each router is in one diff file - each of them is one small sub application
const reviewRouter = require('./routes/reviewRoutes'); // each router is in one diff file - each of them is one small sub application
const bookingRouter = require('./routes/bookingRoutes'); // each router is in one diff file - each of them is one small sub application
const viewRouter = require('./routes/viewRoutes'); // each router is in one diff file - each of them is one small sub application

const app = express(); // we only use app = express(); to config everything that has to do with the Express application

// * PUG ENGINE SETUP
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // path relative to where we launch project


// 1) GLOBAL MIDDLEWARES
// ? Serving static files
// 127.0.0.1:3000/overview.html // dont include directory on url cause brwsr wont find it and search it as root
app.use(express.static(path.join(__dirname, 'public'))); // html css img etc

// ? Set security HTTP headers - helmet() runs everytime in the app reqs
app.use(helmet()); // in app.use( a function goes inside, not a function call

// ? Development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Limit requests from same API
const limiter = rateLimit({ // Rate Limiter is a middleware function we can use
  max: 100, // arbitrary value
  windowMs: 60 * 60 * 1000, // window of time in ms
  message: 'Too many reqs from this IP, please try again in an hour'
});
app.use('/api', limiter);

// ? PARSERS
// * Body PARSER, reading data from body into req.body
// express.json() is a middleware: a function that can modify incoming request data
app.use(express.json({ limit: '10kb' })); // limit amount of data that comes in the body
// * COOKIE PARSER
app.use(cookieParser());
// * URL encoded PARSER
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ? Data Sanatizing -> btw validator function from mongoose schema has cool sanitization features
// * Data sanitizations against NoSQL query injection - after Body parsing incomming data
app.use(mongoSanitize()); // looks at req.body/params/queryString and filters out all $ and : of mongo operators

// * Data saitization against XSS - Mongoose Schema validators protect from XSS aswell
app.use(xss()); // cleans user input from malicious HTML code, by converting html in symbols
// <div>HACK</div> ---> &lt;div>HACKED&lt;/div>

// ? Prevent parameter pollution - at the end to clean up query string
// whitelist is an array of params we do allow to be duplicated
app.use(hpp({ whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'] }));

// ? Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies); // on each req print cookies in console
  next();
});

// * 2) ROUTES

// View router - Root url
app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter); // app.use('subAppUrl', resourceRouter); // the url is shared btwn routes as parent route '/'
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

// ? if none of the routers catch the lines of the 2 routers, jumps to next line -> MIDDLEWARE STACK ORDER
// *3) UNHANDLED ROUTES - .all() all METHODS - * all urls
app.all('*', (req, res, next) => {

  // * when we pass next(parameters) itll assume it is an error, skipping all middleware stack, landing directly in global error handler middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ! GLOBAL ERROR HANDLING MIDDLEWARE - 4 parameters, so express knows its an error handler
app.use(globalErrorHandler);

module.exports = app;
