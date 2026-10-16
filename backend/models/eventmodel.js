const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({

    eventName: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    organizer: {
        type: String,
        required: true
    },

    image: {
        type: String,
        required: true
    },

    status: {
        type: String,
        required: true
    }

});

const Event = mongoose.model('event', eventSchema);

module.exports = Event;