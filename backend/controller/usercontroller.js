const User = require('../models/usermodel');
const Login = require('../models/loginmodel');

// Register new user
const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      address,
      username,
      password,
      usertype
    } = req.body;

    if (
      !name || !email || !phoneNumber ||
      !address || !username || !password
    ) {
      return res.status(400).json({
        message: 'All fields are required'
      });
    }

    const existingUser = await User.findOne({ email });
    const existingLogin = await Login.findOne({ username });

    if (existingUser || existingLogin) {
      return res.status(409).json({
        message: 'Email or username already registered'
      });
    }

    const newUser = new User({
      name,
      email,
      phoneNumber,
      address,
      username,
      password,
      usertype: usertype || 'user'
    });

    await newUser.save();

    await Login.create({
      username,
      password,
      usertype: 'user'
    });

    res.status(201).json({
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);

    res.status(500).json({
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user with username, password and user type
const loginUser = async (req, res) => {
  try {
    const { username, password, usertype } = req.body;

    if (!username || !password || !usertype) {
      return res.status(400).json({
        message: 'Username, password and user type are required'
      });
    }

    const user = await Login.findOne({ username });

    if (
      !user ||
      user.password !== password ||
      user.usertype !== usertype
    ) {
      return res.status(401).json({
        message: 'Invalid username, password or user type'
      });
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        usertype: user.usertype
      }
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getUserById
};