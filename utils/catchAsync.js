// ? Catching Errors in Async Functions - getting rid of trycatch blocks
module.exports = (fn) => {
    // * return anonymous function - assigned to createTour = // called when create tour req is sent
    return (req, res, next) => {
        // * Call the async function we pass as param catchAsync(fn) -> returns a promise -> we send res or .catch(next) to global err handler
        fn(req, res, next).catch(next); // fn() passes err to catch() and catch to next()
    };
};