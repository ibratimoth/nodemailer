const { DataTypes } = require('sequelize');
const { isLowercase } = require('validator');
const { sequelize } = require('./../config/db');

const Auth = sequelize.define('Auth', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isLowercase: true,
            isEmail: true,  // To ensure it's a valid email format
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastLogin: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW  // Equivalent to `default: Date.now` in MongoDB
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true  // Allow null until a token is set
    },
    resetPasswordExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true  // This will be null until a token is set and expires
    },
    verificationToken: {
        type: DataTypes.STRING,
        allowNull: true  // Allow null until a token is set
    },
    verificationTokenExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true  // This will be null until a token is set and expires
    }
}, {
    timestamps: true  // This adds `createdAt` and `updatedAt` automatically
});


module.exports = Auth