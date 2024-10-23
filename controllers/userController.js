const User = require('./../models/userModel');

const createUserController = async (req, res) => {
    try {
        const { name, email, designation } = req.body;

        // Validate input
        if (!name || !email || !designation) {
            return res.status(400).send({
                success: false,
                message: "All fields are required"
            });
        }

        // Check if the user already exists
        const user = await User.findOne({ where: { email } });

        if (user) {
            return res.status(200).send({
                success: true,
                message: "User already exists"
            });
        }

        // Create a new user
        const newUser = await User.create(req.body);

        return res.status(201).send({
            success: true,
            message: "User created",
            newUser
        });

    } catch (error) {
        console.error(error); // Use console.error for error logging
        return res.status(500).send({
            success: false,
            message: "An error occurred"
        });
    }
};

module.exports = {
    createUserController
}