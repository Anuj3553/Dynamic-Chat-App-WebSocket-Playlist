const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
},
    { timestamps: true }
);

module.exports = mongoose.model('Member', memberSchema);