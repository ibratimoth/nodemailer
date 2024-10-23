const express = require("express");
const { registerController, verifyEmail, deleteUserById, loginController, forgotPassword, resetPassword, logout } = require("../controllers/authController");

const router = express.Router()

router.post("/signup", registerController);

//Email verification
router.post('/verify-email', verifyEmail);

//Sign in
router.post('/login', loginController);

//Fogort password
router.post('/forgot', forgotPassword)

//reset Password
router.post('/reset-password/:token', resetPassword)

//delete specific user
router.delete('/deleteUser/:id', deleteUserById);

//Logout route
router.post('/logout', logout)

module.exports = router