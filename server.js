const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');


// ----------------------
// * Connect to our database
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// * Connect DB with Mongoose -> mongoose.connect(databaseURL, {features}).then();
mongoose
//.connect(process.env.DATABASE_LOCAL, { // Local DB
  .connect(DB, { // .connect() retuns a promise
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  }).then(() => { // handle promise connection{} resolved value
    console.log('DB connection successful!');
  });

// ----------------------
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
