const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionType: { type: String, enum: ['Focus', 'Short Break', 'Long Break'], default: 'Focus' },
  duration: { type: Number, required: true }, // in minutes
  completed: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FocusSession', focusSessionSchema);
