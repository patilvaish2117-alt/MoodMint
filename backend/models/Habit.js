const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, default: 'General' }, // e.g. Fitness, Mindfulness, Study, Health
  frequency: { type: String, enum: ['Daily', 'Weekly'], default: 'Daily' },
  streak: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  progress: { type: Number, default: 0 }, // 0 to 100
  emoji: { type: String, default: '🌱' },
  completedDates: [{ type: String }], // Array of YYYY-MM-DD strings
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Habit', habitSchema);
