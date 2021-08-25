const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// Schema
// name, email, photo, password, passwordConfirm - Create a model from it, export it

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please, enter your name'],
    },
    email: {
        type: String,
        required: [true, 'Please, enter your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please enter a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please confirm your password'],
        minlength: 8,
        select: false // * NOT SHOWING PASSWORD IN OUTPUTS
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // * This only works on CREATE n SAVE
            validator: function(el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

// Password Encryption - Fat Models, Thin Controllers
// * Mongoose Middlewares - defined in schemas -> .pre('save'): between getting-MIDDLEWARE-saving data
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next(); // if Document's prop hasnt been modified, skip to next() middleware

    // * Hash the password w/ the cost of 12
    this.password = await bcrypt.hash(this.password, 12);// ? npm i bcryptjs - bcrypt package

    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

// * Pre middleware to save password change timestamp in doc prop -> runs before a document is saved
userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next(); // if doc prop hasnt been modified or doc is new, move on

    // * Minus 1s to make sure timestamp is created before Token -> cause saving in DB is a bit slower than issuing a JWT
    this.passwordChangedAt = Date.now() - 1000; // Ensure new Token has been created after the password has been changed
    next();
});

// ? Middleware to filter only active users -> runs before any query that starts with find*
userSchema.pre(/^find/, function(next) {
    // this. points to current query
    this.find({ active: {$ne: false} });
    next();
});

// * Instance Method: integrate methods to schema->model->instanceObjects
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) { // Called in authController
    // ! this.password -> CANT ACCESS CAUSE select: false
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if(this.passwordChangedAt){
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp; // true || false -> 300 > 200
    }
    // False meas NOT changed
    return false;
}

userSchema.methods.createPasswordResetToken = function() {
    // Password reset token is just a random string not as cryptographically strong as the password hash
    const resetToken = crypto.randomBytes(32).toString('hex');

    // We store the hashed token in DB to compare it with the token the user sends back to allow access to /resetPassword
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // we dont store plain tokens in DB for security reasons

    // console.log({ resetToken }, this.passwordResetToken);

    // Expire time 10 minutes
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // now + 10mins

    return resetToken; // sends modified data to store it with another function
}

const User = mongoose.model('User', userSchema);
module.exports = User;