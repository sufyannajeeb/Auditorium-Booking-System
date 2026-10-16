const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    usertype: { type: String, default: 'user' }
});

const user = mongoose.model('user', userSchema);

module.exports = user;