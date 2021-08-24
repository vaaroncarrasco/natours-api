class AppError extends Error {
    constructor(message, statusCode) { // call constructor in every instance creation
        super(message); // calling parent constructor

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // to recognize app's operational erros

        //                    instance, class
        Error.captureStackTrace(this, this.constructor); // hide function from stack trace to not pollute it
    }
}

module.exports = AppError;