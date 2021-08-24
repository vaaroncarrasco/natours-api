const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// * Closures -> inner functions has access to outter function even if it has already returned
exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    // * Guard clause for 404's
    if (!doc) { return next(new AppError('No document found with that ID', 404)); }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    //                  Model.functionReturnsQuery(id, data, {options})
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    // * Guard clause for 404's
    if (!doc) { return next(new AppError('No document found with that ID', 404)); }

    res.status(200).json({
        status: 'success',
        data: { data: doc }
    });
});

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
        status: 'success',
        data: { data: doc }
    });
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) { return next(new AppError('No document found with that ID', 404)); }

    res.status(200).json({
        status: 'success',
        data: { data: doc }
    });
});


exports.getAll = Model => catchAsync(async (req, res, next) => {
    // To allow nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();

    const doc = await features.query; // .explain() returns stats

    res.status(200).json({
        status: 'success',
        results: doc.length,
        data: { data: doc }
    });
});