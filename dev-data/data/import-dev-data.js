const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel.js')

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
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')); //[{},{}...]

// IMPORT DATA INTO DB
const importData = async () => {
    try {
        await Tour.create(tours); // .create([{}, {}])
        console.log('Data loaded! :D');
    } catch (err) {
        console.log(err);
    }
    process.exit();
}

// DELETE ALL DATA FROM DB
const deleteData = async () => {
    try {
        await Tour.deleteMany(); // .deleteMany() delete whole connection
        console.log('Data deleted! :D');
    } catch (err) {
        console.log(err);
    }
    process.exit();
}
if(process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete'){
    deleteData();
}

console.log(process.argv);