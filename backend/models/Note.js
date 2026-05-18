const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: 'General' }, // Personal, Study, Ideas, Goals, Reminders, Random
  color: { type: String, default: '#fef3c7' }, // Pastel default color (Yellow)
  pinned: { type: Boolean, default: false },
  favorite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', noteSchema);
