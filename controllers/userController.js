// * 2) ROUTE HANDLERS/CONTROLLERS - Param Middlewares and Route Controllers are set but not executed, they run in tourRoutes.js
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// -----------------------------------

const multer = require('multer'); // * upload imgs w/ multer lib
const sharp = require('sharp'); // image manipulation lib

// * Multer lib file uploads - body parser cant handle files
// multer() -> no options{} = it stores img in memory and not in disk
// images are stored in file-system and not directly in DB. In DB we just store the name of the file like 'user1-photo.jpg'

// * diskStorage
// const multerStorage = multer.diskStorage({ // cb -> callback
//   destination: (req, file, cb) => {
//     // if theres error, error. if not, null // '/destination'
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // * UNIQUE FILENAME -> user-userId-timestamp.extension
//     // user-7987978babadad-4458356874.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

// * memoryStorage - good for manipulating files
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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => { // midware runs after uploadUserPhoto and before updateMe midwares
  if (!req.file) return next();

  // define filename w/ user id and timestamp
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer) // * sharp returns promise cause it takes some time
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/users/${req.file.filename}`); // * write file to disk

  next();
});

// ----------------------------------


const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  // Object.keys({}) returns an [] of the obj els so we can loop thru it
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el]; // if fields match, add to newObj{}
  });
  return newObj;
}

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}

exports.updateMe = catchAsync(async(req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400));
  }
  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  // * We can use findByIdAndUpdate() instead of save() cause we dont need to validate non-sensitive data // route is protected btw
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new: true, runValidators: true});

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser }
  });
});

// * Instead of deleting users from DB, just set 'active' prop to true
exports.deleteMe = catchAsync( async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false});

  res.status(204).json({
    status: 'success',
    data: null
  });
});


exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'Please use /signup instead',
  });
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
// Dont update passwords w/ this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

