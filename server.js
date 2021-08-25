const mongoose = require('mongoose');
const dotenv = require('dotenv');

// * Errors outside Express: Uncaught Exceptions -> for Synchronous operations
process.on('unhandledException', err => {
  console.log('UNCAUGHT EXCEPTION! SHUTTING DOWN ...');
  console.log(err.name, err.message);
  process.exit(1);
});

// console.log(x); // Uncaught exception - example

dotenv.config({ path: './config.env' });
const app = require('./app');

// ----------------------
// * Connect to our database
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// * Connect DB with Mongoose -> mongoose.connect(databaseURL, {features}).then();
//mongoose.connect(process.env.DATABASE_LOCAL, { // Local DB
mongoose
  .connect(DB, { // .connect() retuns a promise
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  }).then(() => { // handle promise connection{} resolved value
    console.log('DB connection successful!');
  }); // .catch() to handle promise on DB connection error -> Better use a error handler

// ----------------------
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// * Errors outside Express: Unhandled Rejections -> for Asynchronous operations

// Global Uhandled Rejections Handler -> Last safety net
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! SHUTTING DOWN ...');
  console.log(err.name, err.message);
  // * When DB errors, shutdown gracefully
  server.close(() => { // ? 1) Close server, give it time to finish pendent reqs
    process.exit(1); // 0 -> success // 1 -> uncaught exception // ? 2) Kill server
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});