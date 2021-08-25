const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
}

// ? Cookies:
// ? Small piece of text server sends to clients, browser stores cookie and sends back along all future requests to the server the cookie came from
const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);
     /*
        "A cookie with the HttpOnly attribute is inaccessible to the JavaScript Document.cookie API; it is sent only to the server.
        For example, cookies that persist server-side sessions don't need to be available to JavaScript, and should have the HttpOnly attribute.
        This precaution helps mitigate cross-site scripting (XSS) attacks."
    */
    // .cookie('name', value, optionsObj{}) -> cookie name is a UNIQUE value -> if created twice, cookie is overwritten
    res.cookie('jwt', token, {
        expires: new Date(Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });

    // Remove user password from output -> not removing it from DB tho
    user.password = undefined;

    res.status(statusCode).json({ // 201 means 'created'
        status: 'success',
        token, // * Pass TOKEN
        data: { user } // output w/o password prop
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm
    });

    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) { return next( new AppError('Please provid email and password', 400) ); }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password'); // .select('+hiddenField') -> how to select fields w/ prop select: false

    if( !user || !(await user.correctPassword(password, user.password)) ){
        return next(new AppError('Incorrect email or password', 401));
    }

    // 3) If all good, send token to client
    createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
}

// * Middleware Function that runs before all handlers to check JWT
exports.protect = catchAsync(async (req, res, next) => {
    let token;

    // * 1) Getting token and check if its there -> 'Bearer jdfsjfsdofjdsjfdsf'
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) return next(new AppError('You arent logged in! Please log in and try again.', 401));

    // * 2) Verify token -> verify() is async -> make it return a promise
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // console.log(decoded); // { id, iat, exp } -> users _id

    // * 3) Check if user still exits
    const currentUser = await User.findById(decoded.id); // using JWT id to find user that matches that id
    if (!currentUser) return next(new AppError('The user belonging to this token does no longer exist', 401));

    // * 4) Check if user changed password after the token was issued -> issued at === iat
    if (currentUser.changedPasswordAfter(decoded.iat)) return next(new AppError('User recently changed password! Please log in again.', 401));

    // * Put user data on request
    req.user = currentUser;
    res.locals.user = currentUser; // passing vars to templates w/ res.locals{}

    // * GRANT ACCESS TO PROTECTED ROUTE
    next();
});

// ? Only for rendered pages, no errors!
exports.isLoggedIn = catchAsync(async (req, res, next) => {
    // * API sends token through Authorization header in response{}
    // * Token is stored in clients cookies storage
    // * We check if logged in through client's cookies in req.cookies.jwt

    if (req.cookies.jwt === 'loggedout') return next();
    // if cookie -> go thru this process
    if (req.cookies.jwt) {
        // 1) verify token
        const decoded = await promisify(jwt.verify)(
            req.cookies.jwt,
            process.env.JWT_SECRET
        );

        // 2) Check if user still exists
        const currentUser = await User.findById(decoded.id); // using JWT id to find user that matches that id
        if (!currentUser) return next();

        // 3) Check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) return next();

        // THERE IS A LOGGED IN USER
        // * res.locals{} variables we pass to rendered templates -> like passing data using render()
        res.locals.user = currentUser;
        return next(); // * MAKE SURE next() is only called once
    }

    // In case there's no cookie -> move to next middleware
    // * MAKE SURE next() is only called once
    next();
});


// * restrictTo function that will wrap around a middleware function -> *** Middleware functions only take req, res, next params; thats why...
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide']. role='user'
        if(!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403))
        }
        next(); // If admin or lead-guide -> allow to go to next() middleware
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError('There is no user with email address.', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    try {
      const resetURL = `${req.protocol}://${req.get(
        'host'
      )}/api/v1/users/resetPassword/${resetToken}`;
      await new Email(user, resetURL).sendPasswordReset();

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError('There was an error sending the email. Try again later!'),
        500
      );
    }
  });

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token -> hash the plain token and compare it with DB stored hashed token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token hasnt expired, and there is user, set the new password
    if (!user) { return next(new AppError('Token is invalid or has expired', 400)); }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save(); // * we use document.save() to run validatos -> .findOneAndUpdate() doesnt run validators

    // 3) Update changedPasswordAt property for the user


    // 4) Log the user in, send JWT
    createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync( async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4) Log user in send JWT
    createSendToken(user, 200, req, res);
});