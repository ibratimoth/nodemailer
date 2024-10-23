const validator = require('validator');

const validateRegisterInput = ({ name, email, password }) => {
    if (!name || !email || !password) {
        return { valid: false, message: 'All fields must be filled' };
    }

    if (!validator.isEmail(email)) {
        return { valid: false, message: 'Email is not valid' };
    }

    // Extract the local part of the email address
    const localPart = email.split('@')[0];
    if (localPart[0] !== localPart[0].toLowerCase()) {
        return { valid: false, message: 'Email must start with a lowercase letter' };
    }

    const isValidPassword = validator.isStrongPassword(password, {
        minLength: 6,
        hasUpperCase: true,
        hasLowerCase: true,
        hasNumbers: true,
        hasSymbols: true,
    });

    if (!isValidPassword) {
        return {
            valid: false,
            message: "Password is not strong enough. It must include uppercase, lowercase, numbers, special characters and be at least 6 characters long.",
        };
    }

    return { valid: true };
};

const validateVerificationCode = (code) => {
    if (!code) {
        return { valid: false, message: 'Verification code is required' };
    }
    // Add any other checks if necessary (length, format, etc.)
    return { valid: true };
};

const validatePassword = ({ password }) => {
    if (!password) {
        return { valid: false, message: 'All fields must be filled' };
    }

    const isValidPassword = validator.isStrongPassword(password, {
        minLength: 6,
        hasUpperCase: true,
        hasLowerCase: true,
        hasNumbers: true,
        hasSymbols: true,
    });

    if (!isValidPassword) {
        return {
            valid: false,
            message: "Password is not strong enough. It must include uppercase, lowercase, numbers, special characters and be at least 6 characters long.",
        };
    }

    return { valid: true };
};


module.exports = {
    validateRegisterInput, validateVerificationCode, validatePassword
};
