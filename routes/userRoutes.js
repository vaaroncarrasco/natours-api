const express = require('express'); // for express router
const userController = require('./../controllers/userController');

// -----------------------
// * 3) ROUTES

// always specify api version - callback is called route handler
// app.get('/api/v1/tours', getAllTours);

// * Responding to URL parameters -> GET /api/v1/tours/:variable/:optional? -> /api/v1/tours/5 => js reg obj { id: '5', y: undefined }
// app.get('/api/v1/tours/:id', getTour);

// * Handling PATCH requests -> we expect only the properties we want to update on the object
// app.patch('/api/v1/tours/:id', updateTour);

// * Handling DELETE requests
// app.delete('/api/v1/tours/:id', deleteTour);

// * Handling POST requests - POST request can send data from client to server.
// request object holds all the information about the request that was done.
// If request contains data that was sent, data should be on the request

// Express does not put the desired-to-be-post data in the request object.
// * Express passes post data through MIDDLEWARE | express.json() is a middleware: a function that can modify incoming request data
// * Middleware is a step that the request goes through while being processed / request-(middleware)-response.
// * -> data from the body is added to the request object by using the middleware
// app.use(express.json()); goes on top

// app.post('/api/v1/tours', createTour); // Every time tours-simple.json changes on post or manually, nodemon restarts and re-reads the file, allowing to get the recent {} from the array

// * - ROUTE HANDLERS - Middleware functions that only apply to a certain URL
// * BETTER ROUTING -> chaining request methods if url is the same

// ------ Mounting The Router - Mounting a new router on the route -----------
// * Creating and Mounting Multiple Routers -> Resource Routers act like middlewares when being connected to main app router
// * const app = express(); express() is a router of the whole app -> app is a router - each RESOURCE has to have its own router
// Connect resource router to app router -> app.use(middleware)




// -----------------------
// * 3) ROUTER - routers are middlewares so we can mount them using app.use(middleware)
// ? Router directions request to certain route
// const app = express(); // app main router
// app.use(middleware)
// app.use('subAppRoute', resourceRouter); // resourceRouter behaves as a middleware


// convention - routers are stored as 'router' to be exported
const router = express.Router(); // special router for the tours-simple.json resource

// route('/') takes parentRoute from resource router
router.route('/').get(userController.getAllUsers).post(userController.createUser);
router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);

// export single variable -> module.exports = single;
module.exports = router;
