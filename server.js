// * Good practice - have everything related to express in one file, and everything related to the SERVER in another main file
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' }); // read(only once) vars from files and save them into NodeJS env variables and use them in other files
// we require dotenv module to read config.env and then we run app.js code by requiring it

const app = require('./app');

// -------------------------
// * Environment Variables
// Express Environment Variables
// console.log(app.get('env')); // development
// NodeJS Environment Variables coming from Process Core Module
// console.log(process.env); // {...} multiple env vars

// *Express packages depend on a special manually set variable called NODE_ENV (convention) that defines whetere we're in development or production
// * > NODE_ENV=development nodemon server.js
// > NODE_ENV=development nodemon server.js -> define NODE_ENV inside process.env{}
// > NODE_ENV=development X=23 nodemon server.js -> define otherVariables=23 inside process.env{}
// * NODE_ENV=production nodemon server.js
/*
We use env vars for config settings for our apps.
When our app needs some config for stuff that might change based on the environment app is running in, we use environment variables
    Ex. We might use diff DBs for development/testing and we can define a different env var for each
    Ex. Set sensitive data like keys, user, passwords as environment variables only during development
* We define environment variables in config.env // dont set them in the terminal

- config.env - ENV_VARIABLES_IN_CAPS
NODE_ENV=development
PORT=8000
USERNAME=jonas
PASSWORD=1234

* Connect config.env w/ node app - read from text file config.env and save as env variables | npm i dotenv
1. server.js require dotenv module on top of file:
    dotenv.config({path: './config.env'}); // read vars from files and save them into NodeJS env variables
2. if we log the process.env{} it should also log the variables from config.env

* Use env variables on app.js - reading env variables only happens once and env vars are saved in process.env{} ready to be used in other files

*/

// ? in server.js we can have non related to express stuff like, db configs, err handlers, environment variables, etc.

// server.js - is now the starting file, the entry point where everything starts and where we listen to our server
// * 4) START SERVER
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`App runnin on port ${port}...`));
