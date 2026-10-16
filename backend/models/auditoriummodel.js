const mongoose = require('mongoose');

const auditoriumSchema = new mongoose.Schema({

    auditoriumName: {
        type: String,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    capacity: {
        type: Number,
        required: true
    },

    pricePerDay: {
        type: Number,
        required: true
    },

    image: {
        type: String,
        required: true
    },

    status: {
        type: String,
        required: true
    },

    facilities: {
        type: String,
        required: true
    }

});

const Auditorium = mongoose.model('auditorium', auditoriumSchema);

module.exports = Auditorium;