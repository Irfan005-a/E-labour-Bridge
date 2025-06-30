const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'closed', 'in-progress'], default: 'open' },
    postedDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', JobSchema); 