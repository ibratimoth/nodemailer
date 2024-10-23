const { Op } = require('sequelize'); // Import Op from Sequelize
const User = require('./../models/authModel');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validateRegisterInput, validatePassword } = require('../utils/validators');
const { validateVerificationCode } = require('../utils/validators');
const { sendResponse } = require('../utils/responses');
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendResetSuccessEmail } = require('../nodemailer/email');
const generateTokenAndSetCookie = require('../utils/generateToken');

const registerController = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        const validation = validateRegisterInput({ name, email, password });
        if (!validation.valid) {
            return sendResponse(res, 400, false, validation.message);
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } }); // Using Sequelize findOne method
        if (existingUser) {
            return sendResponse(res, 400, false, 'Already Registered, please login');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create verification token and expiry time
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now

        // Create new user
        const user = await User.create({ // Using Sequelize create method
            name,
            email,
            password: hashedPassword,
            verificationToken,
            verificationTokenExpiresAt,
        });

        // Generate token and set cookie
        // generateTokenAndSetCookie(res, user.id); // Ensure you're using the correct user ID field

        // Send verification email
        await sendVerificationEmail(user.email, verificationToken);

        // Return success response
        sendResponse(res, 201, true, "User registered successfully", {
            ...user.get(), // Use get() method to retrieve the user instance data
            password: undefined,  // Don't send the password back in the response
        });

    } catch (error) {
        console.error(error);
        sendResponse(res, 500, false, 'Error in registration', error);
    }
};

const verifyEmail = async (req, res) => {
    const { code } = req.body;

    try {
        // Validate verification code input
        const validation = validateVerificationCode(code); // Optional: Implement this function if needed
        if (!validation.valid) {
            return sendResponse(res, 400, false, validation.message);
        }

        // Find user by verification token and check if the token is still valid
        const user = await User.findOne({
            where: {
                verificationToken: code,
                verificationTokenExpiresAt: {
                    [Op.gt]: new Date() // Using Sequelize's operator for greater than
                }
            }
        });

        if (!user) {
            return sendResponse(res, 400, false, "Invalid or expired verification code");
        }

        // Update user status and remove verification fields
        user.isVerified = true;
        user.verificationToken = null; // Better to set to null
        user.verificationTokenExpiresAt = null;
        await user.save();

        // Send welcome email
        await sendWelcomeEmail(user.email, user.name);

        // Send success response
        sendResponse(res, 200, true, "Email verified successfully", {
            ...user.get(), // Use get() to retrieve user data
            password: undefined // Don't send the password back
        });
    } catch (error) {
        console.error(error);
        sendResponse(res, 500, false, 'Error while verifying email', error);
    }
};

const loginController = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if all required fields are provided
        if (!email || !password) {
            return sendResponse(res, 400, false, 'All fields must be provided.');
        }

        // Find user by email using Sequelize
        const user = await User.findOne({ where: { email } });

        // If user not found
        if (!user || user.isVerified !== true) {
            return sendResponse(res, 400, false, 'Invalid credentials or account not verified.');
        }

        // Check if password is valid
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return sendResponse(res, 400, false, 'Invalid credentials.');
        }

        // Generate token and set cookie
        const { accessToken, refreshToken } = generateTokenAndSetCookie(res, user.id);

        // Update last login timestamp
        await user.update({ lastLogin: new Date() });

        // Return successful response, omitting the password from the user object
        return sendResponse(res, 200, true, 'Logged in successfully', {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                lastLogin: user.lastLogin,
                isVerified: user.isVerified,
            }, tokens: {
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Error in login:', error);
        return sendResponse(res, 500, false, 'An error occurred during login.');
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Check if the email is provided
        if (!email) {
            return sendResponse(res, 400, false, 'Email is required');
        }

        // Find the user by email using Sequelize
        const user = await User.findOne({ where: { email } });

        // If user does not exist, return error
        if (!user || user.isVerified !== true) {
            return sendResponse(res, 404, false, 'User not found or account not verified');
        }

        // Generate a secure reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Set token expiration time (1 hour)
        const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

        // Update user with the reset token and expiration time
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt;

        // Save the user with updated information
        await user.save();

        // Construct the password reset URL
        const resetUrl = `http://localhost:4003/api/auth/reset-password/${resetToken}`;

        // Send password reset email
        await sendPasswordResetEmail(user.email, resetUrl);

        // Respond with success message
        return sendResponse(res, 200, true, 'Password reset link sent to your email', { resetToken });

    } catch (error) {
        console.error('Error in forgotPassword:', error);

        // Respond with error message
        return sendResponse(res, 500, false, 'An error occurred while processing your request');
    }
};

const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        // Validate request parameters and body
        if (!token || !password) {
            return sendResponse(res, 400, false, 'Reset token and new password must be provided.');
        }

        // Validate input
        const validation = validatePassword({ password });
        if (!validation.valid) {
            return sendResponse(res, 400, false, validation.message);
        }
        // Find user by reset token and check if it has expired
        const user = await User.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpiresAt: { [Op.gt]: Date.now() }, // Ensure using Sequelize operators
            },
        });

        // If user not found or token is invalid/expired
        if (!user) {
            return sendResponse(res, 400, false, 'Invalid or expired reset token.');
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = null; // Clear reset token
        user.resetPasswordExpiresAt = null; // Clear expiration time

        // Save updated user information
        await user.save();

        // Send success email
        await sendResetSuccessEmail(user.email);

        // Send response indicating success
        return sendResponse(res, 200, true, 'Password reset successful.');
        
    } catch (error) {
        console.error('Error in resetPassword:', error);
        return sendResponse(res, 500, false, 'An error occurred while resetting the password.');
    }
};

const deleteUserById = async (req, res) => {
    const { id } = req.params; // Get the user ID from the request parameters

    try {
        // Find the user by ID
        const user = await User.findByPk(id);

        // Check if the user exists
        if (!user) {
            return sendResponse(res, 404, false, 'User not found');
        }

        // Delete the user
        await User.destroy({
            where: { id },
        });

        // Send a success response
        sendResponse(res, 200, true, 'User deleted successfully');
    } catch (error) {
        console.error(error);
        sendResponse(res, 500, false, 'Error deleting user', error);
    }
};

const logout = async (req, res) => {
    res.clearCookie('token')
    res.status(200).json({ success: true, message: "Logged out successfully" })
}


module.exports = { registerController, verifyEmail, deleteUserById, loginController, forgotPassword, resetPassword , logout}
