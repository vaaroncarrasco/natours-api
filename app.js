// APP CONFIGURATION - in one standalone file
// app.js is mainly used for middleware declarations - having all middleware we want to apply to all routes

// * Good practice - have everything related to EXPRESS / app configuration in one file, and everything related to the server in another main file

/*  APP FLOW // >nodemon server.js || >npm start // server.js runs to make all app logic run
1. We receive request{} in app.js file | req/res cycle STARTS
2. Depending on route, request{} goes in one of the router, ex. tourRouter
3. Then, depending on the route and the request{}, the router directs request{} to a certain route and its controller
4. Router's route controller runs and response{} gets sent back to client | req/res cycle ENDS
*/

const express = require('express');
const morgan = require('morgan'); // variable/package same name convention
// * Importing route controllers, routers as separated modules
const tourRouter = require('./routes/tourRoutes'); // each router is in one diff file - each of them is one small sub application
const userRouter = require('./routes/userRoutes'); // each router is in one diff file - each of them is one small sub application

const app = express(); // we only use app = express(); to config everything that has to do with the Express application
// * express() router -> app is the router - each resource has to have its own router
// const tourRouter = express.Router();

// -----------------------
// * 1) MIDDLEWARES

// * Use env variables on app.js
if (process.env.NODE_ENV === 'development') {
  // * Morgan middleware - morgan('loggingStyle') // there are more npm middlewares compatible with express besides Morgan // expressjs.com
  // * morgan() -> return function logger (req, res, next) => { //req data //res data //record req data // function logRequest ... // next() }
  app.use(morgan('dev'));
  // morgan's console log - 'dev' style: // GET /api/v1/tours 200 3.410 ms - 8681
}

// * Middleware is a step that the request goes through while being processed / request-(middleware)-response.
app.use(express.json()); // express.json() is a middleware: a function that can modify incoming request data

// * Static files // .static('the directory from where we want to serve its files')
app.use(express.static(`${__dirname}/public`)); // 127.0.0.1:3000/overview.html // dont include directory on url cause brwsr wont find it and search it as root
// 127.0.0.1:3000/overview.html -> client requests .html and all its containing files like imgs -> all requests are sent to server

// * Create our own Middleware - Express passes request/response objs as arguments and next() function as 3rd argument to pass req/res {}s thru middleware stack
// * Our own middleware goes on top to always run before all the other important middlewares
app.use((req, res, next) => {
  // middleware runs after someone sends any request method to server, after middleware runs, response is send back to client
  console.log('Hello from middleware');
  next(); // always call next() to keep req/res cycle
});

app.use((req, res, next) => {
  // we can handle this code in other route handler; like loggin it to console in getAllTours
  req.requestTime = new Date().toISOString(); // create prop on client req {} and add current time stamp
  next();
});

// -----------------------
// * 3) ROUTER - routers are middlewares so we can mount them using app.use(middleware)
// ? Router directions request to certain route
// const app = express(); // app main router
// app.use(middleware)
// app.use('subAppRoute', resourceRouter); // resourceRouter behaves as a middleware

// Request goes into middleware stack, request hits this line of code, matches url route, resourceRouter runs, which has own routes
app.use('/api/v1/tours', tourRouter); // app.use('subAppUrl', resourceRouter); // the url is shared btwn routes as parent route '/'
app.use('/api/v1/users', userRouter);

// * Export app so it can be used in server.js on server start
module.exports = app;
