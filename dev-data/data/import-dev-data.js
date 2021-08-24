const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel.js')
const User = require('./../../models/userModel.js')
const Review = require('./../../models/reviewModel.js')

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, { // .connect() retuns a promise
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  }).then(() => { // handle promise connection{} resolved value
    console.log('DB connection successful!');
  });

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')); //[{},{}...]
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8')); //[{},{}...]
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')); //[{},{}...]

// IMPORT DATA INTO DB
const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false }); // skip create user validations
        await Review.create(reviews);
        console.log('Data loaded! :D');
    } catch (err) {
        console.log(err);
    }
    process.exit();
}

// DELETE ALL DATA FROM DB
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data deleted! :D');
    } catch (err) {
        console.log(err);
    }
    process.exit();
}

if(process.argv[2] === '--import') { // >node ./dev-data/data/import-dev-data.js --import
    importData();
} else if (process.argv[2] === '--delete'){ // >node ./dev-data/data/import-dev-data.js --delete
    deleteData();
}