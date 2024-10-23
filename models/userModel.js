const { DataTypes } = require('sequelize');
const { isLowercase } = require('validator');
const { sequelize } = require('./../config/db');

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        isLowercase: true,
        unique: true
    },
    designation: {
        type: DataTypes.STRING,
        allowNull: false
    },
});


module.exports = User