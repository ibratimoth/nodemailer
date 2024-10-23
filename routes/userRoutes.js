const express = require("express")
const { createUserController } = require("../controllers/userController")

const router = express.Router()

router.post("/addUser", createUserController);

module.exports = router