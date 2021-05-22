const fs = require('fs'); // for reading/writing the tours json file

// -----------------------
// * 2) ROUTE HANDLERS/CONTROLLERS - Param Middlewares and Route Controllers are set but not executed, they run in tourRoutes.js

// * Handling GET requests
// * before sending the data ('/api/v1/tours') to client. we first READ it before/outside the route handler
// * cause top-level runs only once after app startup // note: google __dirname
const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)); // parse [] of JSON {}s to [] of javascript {}s
// * now we can send it back to client

// * Express relies only on middleware stack pipeline on the req/res cycle.
// * Param middlewares check parameters during the middleware stack running before the last middleware.

// * Param Middleware function as exports.prop to be exporteds - Middleware is set but not executed
exports.checkID = (req, res, next, value) => {
    console.log(`Tour id is: ${value}`); // /api/v1/tours/5 -> value = 5
    if (req.params.id * 1 > tours.length) { // if /:id is greater than number os tours - invalid id
        return res.status(404).json({ // if invalid, return response w/ error and stop req/res cycle
            status: 'fail',
            message: 'Invalid ID'
        });
    }
    next(); // if id is valid, move request{} to next() middleware
}

// * Multiple middlewares - router.route('/').post(checkBody, tourController.createTour);
// * checkBody Middleware
exports.checkBody = (req, res, next) => {
    if(!req.body.name || !req.body.price) { // if props dont exist
        return res.status(400).json({ // 400 means bad request
            status: 'error',
            message: 'name and price properties are required'
        });
    }
    next(); // move to next() middleware -> createTour
}

// * when request method runs route middleware function getAllTours, by sending a response, we end the req/res cycle so no other middlewares will run
exports.getAllTours = (req, res) => { // callback block code runs in event loop
    // console.log(req.requestTime); // print in console the prop made in the previously executed middleware

    // JSend Response Standard -> Status and envelope using data: { tours }
    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        results: tours.length, // when sending [{}], specify []'s length
        data: {
            //key: value
            // tours: tours // if same name, only type once
            tours
        }
    });
}

exports.getTour = (req, res) => {
    console.log(req.params); // req.params -> all url parameters inside {} // js object -> { id: '5' }

    const id = req.params.id * 1; // conver '5' * 1 to number = 5
    const tour = tours.find(el => el.id === id); // loop over the array and find with matching condition thru all elemens -> find(callback)

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    });
}

exports.createTour = (req, res) => { // always send a response. Keep the request<->response cyc le
    // console.log(req.body); // when POST request json object is send, show it in console as js object

    const newId = tours[tours.length - 1].id + 1;
    // Object.assign({}, {}) creates a new object by merging two existing objects
    const newTour = Object.assign({id: newId}, req.body); // {id: newId}, {req.body} | req.body is the data {} we send through POST request, we dont mutate it

    tours.push(newTour); // push newTour{} into const tours [{}, {}, ...]
    // write tours-simple.json file with updated array of objects, updated normal js array we want to write, callback function
    fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => { // turn JS[] into JSON format for the .json file
        // 201 means created -> created new resource on server
        res.status(201).json({ // response
            status: 'success',
            data: {
                tour: newTour
            }
        });
    });
    // res.send('ok'); // WE CAN NOT SEND 2 RESPONSES -> Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
}

exports.updateTour = (req, res) => {
    // when we  update an object or resource, we send back ok 200 status code
    res.status(200).json({
        status: 'success',
        data: {
            tour: '<updated tour here...>'
        }
    });
}

exports.deleteTour = (req, res) => {
    // 204 means no content
    res.status(204).json({
        status: 'success',
        data: null // no data is sent back
    });
}

// ? Export multiple variables -> exports.variable = code; // creating multiple properties inside exports{} so they can be imported as props