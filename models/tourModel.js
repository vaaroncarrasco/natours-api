const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

// * Creating Model: Blueprint to create documents -> like JS Classes
// * To create Models we need a Schema (Mongoose Schema): to describe our data, set default values, validate data

// *Schema
const toursSchema = new mongoose.Schema({ // .Schema({schema definition obj}, {schema options obj})
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // ? Validator
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40chars'], // ? String Validator
      minlength: [40, 'A tour name must have more or equal than 10chars'] // ? String Validator
      // ! Validator library from github validator{} contains methods
      // validate: validator.isAlpha()
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: { // ? String Validator
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty values are easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'], // ? Number/Dates Validator
      max: [5, 'Max rating value is 5'] // ? Number/Dates Validator
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: { // * validate document's prop value - COMPARE VALUES FROM DIFF FIELDS
        validator: function(val) { // ? Custom validator - reg function to access this kw -> document prop
          // * this only points to current doc on NEW document creation -> .create()
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price' // ({VALUE}) mongoose reference to value from validator
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false // hide from output
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    }
}, {
  // * Making our virtual props in output
  toJSON: { virtuals: true }, // as JSON virtuals are shown
  toObject: { virtuals: true }, // as {} virtuals are shown
});

// * Virtual Properties: non database-saved fields defined in our schema. e.g Converting field prop miles to km
toursSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
}); // => function doesnt have its own this kw - regular functions do have this kw

// * Document middleware: runs before .save() and .create() // ! not in .inserMany()
toursSchema.pre('save', function(next) { // Callback runs before a document is saved to the DB
  // Creating SLUG based on tour name
  this.slug = slugify(this.name, {lower: true}); // Modifyin Schema Model's property
  next();
});

// * We can have middleware running before( .pre() ) & after( .post() ) a certain event, in document middleware that event is usually 'save'
// * in the middleware function itself we access to this.kw that points to currently-being-saved document
// * 'save' middleware only runs on .save() / .create() // NOT in insertMany()/findOneAnd...()

// * Multiple pre/post middlewares for same 'hook' -> 'save' is a hook/middleware
// toursSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// })

// * .post() middleware functions run after all pre middlewares have completed
// toursSchema.post('save', function(doc, next) { // doc -> finished document
//   console.log(doc);
//   next(); // always inlcude next()
// });

// * Query Middleware: run functions before or after certain query is executed  -> .pre('find') hook
// * this kw points to current query
// toursSchema.pre('find', function(next) { // Callback runs before any 'find' query is executed ->runs before .find() on GET requests
toursSchema.pre(/^find/, function(next) { // run before any hook starting with ^find...() / find() or findOne()
  this.find({ secretTour: {$ne: true} }); // only the tours that have secretTour: false
  this.start = Date.now(); // timestamp
  next();
});

// * Query middleware - run POST every find...() query execution
toursSchema.post(/^find/, function(docs, next){
  console.log(`Query took ${Date.now() - this.start} milliseconds!`); // QUery took 68 milliseconds!
  console.log(docs); // log requested documents
  next();
});

// * Aggregation Middleware -pre/post aggregation execution
toursSchema.pre('aggregate', function(next) { // runs before aggregate()
  // this kw points to current aggregation obj {} - pipeline() method of aggregation{}
  // console.log(this.pipeline()); // pipeline -> [{}] of stages
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // unshift -> start add [] // shift -> end add []

  next();
});

// Models use First letter in capital
//                          ModelName, modelSchema
const Tour = mongoose.model('Tour', toursSchema);
module.exports = Tour;