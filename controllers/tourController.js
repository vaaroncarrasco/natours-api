const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

// ---------------------
const multer = require('multer'); // * upload imgs w/ multer lib
const sharp = require('sharp'); // image manipulation lib

const multerStorage = multer.memoryStorage(); // stored as a buffer - available at req.file.buffer - filename not set

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new AppError('Not an img! Please upload only images', 400), false)
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// ? Uploading images with multer
// upload.single('image') // * one // SINGULAR req.file
// upload.array('images', 5) // * multiple fields same name // PLURAL req.files
exports.uploadTourImages = upload.fields([ // * mutiple fields DIFF name // PLURAL req.files
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    console.log(req.files);

    if (!req.files.imageCover || !req.files.images) return next();

    // 1) Cover image - put filename on body to update it as string to db
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer) // * sharp returns promise cause it takes some time
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/tours/${req.body.imageCover}`); // * write file to disk

    // 2) Images
    // Tour Schema expects array of strings filenames ['', '', '']
    req.body.images = []; // declare empty array to push images filenames in

    await Promise.all( // * promise all promises sharp returns for each image processing
        req.files.images.map(async (file, i) => {

            const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
            await sharp(file.buffer) // * sharp returns promise cause it takes some time
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({quality: 90})
                .toFile(`public/img/tours/${filename}`); // * write file to disk

            req.body.images.push(filename); // push images filenames one by one
        })
    );

    // Move to update tour handler
    next();
});

// ---------------------------

exports.aliasTopTours = (req, res, next) => {
    // * Pre-filling query params for the user
    // setting query{} properties values
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// * Aggregation Pipeline: Matching and Grouping
exports.getTourStats = catchAsync(async (req, res, next) => { // MongoDB Framework for Data Aggregation
    // .aggregate() query returns an aggregate{}
    const stats = await Tour.aggregate([ // each arr element -> stage{$}
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                // _id: '$ratingsAverage', // specified field
                _id: { $toUpper: '$difficulty' }, // specified field
                numTours: { $sum: 1 }, // sum one on each element // total: 9
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage'},
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 } // 1 means ascending
        }
        // {
        //     $match: { _id: { $ne: 'EASY' } } // match not equal(ne) to 'EASY'
        // }
    ]);

    res.status(200).json({
        status: 'success',
        data: { stats }
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1; // 2021

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                $gte: new Date(`${year}-01-01`),
                $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
        $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numTourStarts: -1 }
        },
        {
            $limit: 12
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: { plan }
    });
});


// -> /tours-within/:distance/center/:latlng/unit/:unit
// -> /tours-within/233/center/34.16284702306181,-118.19744918810001/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [ lat, lng ] = latlng.split(',');

    // sphere radius in radians
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) { next(new AppError('Please provide latitude & longitude in the format lat,lng.', 400)); }

    console.log(distance, lat, lng, unit);

    // * We should index startLocation to get the data faster
    // toursSchema.index({ startLocation: '2dsphere' });
    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [ [lng, lat], radius ]
            }
        }
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: { data: tours }
    });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [ lat, lng ] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) { next(new AppError('Please provide latitude & longitude in the format lat,lng.', 400)); }

    const distances = await Tour.aggregate([ // aggregate a field using this params
        {
            $geoNear: { // requires geospatial index field // startLocation // multiple fields usekey parameters
                near: {
                    type: 'Point',
                    coordinates: [ lng * 1, lat * 1 ]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: { data: distances }
    });

});