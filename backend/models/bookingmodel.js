const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    auditoriumId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'auditorium',
        required: true
    },

    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'event',
        required: true
    },

    bookingDate: {
        type: Date,
        required: true
    },

    time: {
        type: String,
        required: true
    },

    noOfPeople: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        required: true
    }

});

const Booking = mongoose.model('booking', bookingSchema);

module.exports = Booking;