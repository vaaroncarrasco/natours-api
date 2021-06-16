const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
    // * Pre-filling query params for the user
    // setting query{} properties values
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}

exports.getAllTours = async (req, res) => {
    try {
        console.log(req.query); // returns { key: value, } containing query params key and value

        // * EXECUTE QUERY
        //          instanceName = new class(mongoose queery on Model.find(), route's request query).method()
        // *                            (query{}, express queryString)
        const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();
        // we manipulatr query{} until the end, then we await the result, so it can come back with the requested data

        const tours = await features.query; // features{} query prop - features.query
        // query.sort().select().skip().limit()

        // * SEND RESPONSE
        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: { tours }
        });
    } catch(err) {
        res.status(404).json({
            status: 'Fail',
            message: err
        })
        console.log(err);
    }
}
exports.getTour = async (req, res) => {

    try {
        const tour = await Tour.findById(req.params.id);
        // Tour.findOne({ _id: req.params.id })

        res.status(200).json({
            status: 'success',
            data: { tour }
        });
    } catch (err) {
        res.status(400).json({
            status: 'Bad request error',
            message: err
        })
    }
}

// * Async/Await function to handle Model.create({}) response value
exports.createTour = async (req, res) => {
    try {
        // * Create documents Model.create({data we wanna store in DB}) -> returns promise we Await and then store in const
        const newTour = await Tour.create(req.body);
        res.status(201).json({
            status: 'success',
            data: { tour: newTour }
        });
    } catch(err) { // Send a 400 bad request response saying there was an error
        res.status(400).json({
            status: 'fail',
            message: err
        });
    }
}

exports.updateTour = async (req, res) => {
    try{
        //                  Model.functionReturnsQuery(id, data, {options})
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: { tour }
        });
    }catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err
        });
    }
}

exports.deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id)
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        });
    }
}

// * Aggregation Pipeline: Matching and Grouping
exports.getTourStats = async (req, res) => { // MongoDB Framework for Data Aggregation
    try {
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

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        });
    }
}
exports.getMonthlyPlan = async (req, res) => {
  try {
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
      data: {
        plan
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};