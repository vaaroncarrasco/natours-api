// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Please, write a review']
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        tour: { // ? Referencing
            type: mongoose.Schema.ObjectId, // tour id
            ref: 'Tour',
            required: [true, 'Review must belong to a tour']
        },
        user: { // ? Referencing
            type: mongoose.Schema.ObjectId, // tour id
            ref: 'User',
            required: [true, 'Review must belong to a user']
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// ? POPULATING FIELDS - pre middleware // 1st reference then populate
reviewSchema.pre(/^find/, function(next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // }); // * too much populates chained, kinda useless to query this data

    this.populate({
        path: 'user',
        select: 'name photo'
    });
    next();
});

// * modelSchema.statics.functions
reviewSchema.statics.calcAverageRatings = async function(tourId) { // this kw points to model
    const stats = await this.aggregate([ // aggregation pipeline on model
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, { // just await for the upload to current tour, dont store promise
            ratingsQuantity: stats[0].nRating, // [{ nRating, avgRating }]
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, { // just await for the upload to current tour, dont store promise
            ratingsQuantity: 0, // [{ nRating, avgRating }]
            ratingsAverage: 4.5
        });
    }
}

// * Run Schema static method
// ? .post() -> we get access to document not query // post query execution
reviewSchema.post('save', function() { // ? Post save run calcAverageRating
    // Review.calcAverageRatings(this.tour); -> Review isnt defined yet
    // this = current review document // .constructor = Review model who created the document
    this.constructor.calcAverageRatings(this.tour); // this.tour -> currentReview.tour

    // * 'post' middleware doesnt have access to next()
});

// ----------------------------------------------

// findByIdAndUpdate == findOneAndUpdate
// findByIdAndDelete == findOneAndDelete

// // ? .pre() -> we get access to query not document // post query execution
// reviewSchema.pre(/^findOneAnd/, async function(next) { // * this kw is current query{} = this{}
//     this.r = await this.findOne(); // r = review
//     next();
// });

// // * PASSING DATA THRU MIDDLEWARES BY ADDING PROPERTIES TO this{}

// // ? .post() -> we get access to document not query // post query execution
// reviewSchema.post(/^findOneAnd/, async function() {// * this kw is current query
//     await this.r.constructor.calcAverageRatings(this.r.tour);
// });

reviewSchema.post(/^findOneAnd/, async function(doc) {
    await doc.constructor.calcAverageRatings(doc.tour);
});

// reviewSchema.post(/^findOneAnd/, async function(doc) {
//     if (doc) await doc.constructor.calcAverageRating(doc.tour);
// });
// ----------------------------------------------

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
