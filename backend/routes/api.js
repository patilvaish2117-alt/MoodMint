const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Database Models
const User = require('../models/User');
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const Note = require('../models/Note');
const FocusSession = require('../models/FocusSession');

// Helper to get formatted date string in local timezone
const getLocalDateString = () => {
  return new Date().toLocaleDateString('sv-SE'); // Returns YYYY-MM-DD
};

// ==========================================
// SIMPLE AUTH MIDDLEWARE
// ==========================================
const auth = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    // Extract token and verify
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'moodmint_secret_key_123');
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// ==========================================
// AUTHENTICATION APIs
// ==========================================

// Register a new user
router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists' });

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ username, email, password: hashedPassword });
    await user.save();

    // Create JWT token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'moodmint_secret_key_123', { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, username, email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login existing user
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    // Check password matches
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

    // Generate JWT token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET || 'moodmint_secret_key_123', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user profile (using auth token)
router.get('/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching user profile' });
  }
});


// ==========================================
// PLANNER/TASK APIs
// ==========================================

// Get all tasks for user
router.get('/tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new task
router.post('/tasks', auth, async (req, res) => {
  try {
    const { title, priority, dueDate } = req.body;
    const task = new Task({ userId: req.user._id, title, priority, dueDate });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update an existing task (toggle complete, rename, priority change)
router.put('/tasks/:id', auth, async (req, res) => {
  try {
    const { title, completed, priority, dueDate } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title, completed, priority, dueDate },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a task
router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// ==========================================
// HABIT TRACKER APIs
// ==========================================

// Get all habits and auto-update weekly completion rates
router.get('/habits', auth, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
    // Auto-update 'completed' status based on whether today's date is in completedDates
    const today = getLocalDateString();
    for (let habit of habits) {
      const isCompletedToday = habit.completedDates.includes(today);
      if (habit.completed !== isCompletedToday) {
        habit.completed = isCompletedToday;
        
        // Calculate weekly progress
        const completedThisWeek = habit.completedDates.filter(d => {
          const date = new Date(d);
          const diffTime = Math.abs(new Date() - date);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        }).length;
        habit.progress = Math.min(Math.round((completedThisWeek / 7) * 100), 100);
        await habit.save();
      }
    }
    res.json(habits);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new habit
router.post('/habits', auth, async (req, res) => {
  try {
    const { title, category, frequency, emoji } = req.body;
    const habit = new Habit({
      userId: req.user._id,
      title,
      category: category || 'General',
      frequency: frequency || 'Daily',
      emoji: emoji || '🌱',
      streak: 0,
      completed: false,
      progress: 0
    });
    await habit.save();
    res.status(201).json(habit);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Edit habit details
router.put('/habits/:id', auth, async (req, res) => {
  try {
    const { title, category, frequency, emoji } = req.body;
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title, category, frequency, emoji },
      { new: true }
    );
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete or uncomplete a habit (streak calculator)
router.patch('/habits/:id/complete', auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const today = getLocalDateString();
    const dateIndex = habit.completedDates.indexOf(today);

    if (dateIndex > -1) {
      // Toggle off
      habit.completedDates.splice(dateIndex, 1);
      habit.completed = false;
      habit.streak = Math.max(0, habit.streak - 1);
    } else {
      // Toggle on
      habit.completedDates.push(today);
      habit.completed = true;
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('sv-SE');
      
      // Calculate/increment streak
      if (habit.completedDates.includes(yesterdayStr) || habit.streak === 0) {
        habit.streak += 1;
      } else {
        habit.streak = 1;
      }
    }

    const completedThisWeek = habit.completedDates.filter(d => {
      const date = new Date(d);
      const diffTime = Math.abs(new Date() - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length;
    
    habit.progress = Math.min(Math.round((completedThisWeek / 7) * 100), 100);

    await habit.save();
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete habit
router.delete('/habits/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    res.json({ message: 'Habit deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// ==========================================
// AESTHETIC NOTES SYSTEM APIs
// ==========================================

// Get all notes
router.get('/notes', auth, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create note
router.post('/notes', auth, async (req, res) => {
  try {
    const { title, content, category, color, pinned, favorite } = req.body;
    const note = new Note({
      userId: req.user._id,
      title,
      content,
      category: category || 'General',
      color: color || '#fef3c7',
      pinned: pinned || false,
      favorite: favorite || false
    });
    await note.save();
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update note
router.put('/notes/:id', auth, async (req, res) => {
  try {
    const { title, content, category, color, pinned, favorite } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title, content, category, color, pinned, favorite },
      { new: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Pin note PATCH
router.patch('/notes/:id/pin', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    
    note.pinned = !note.pinned;
    await note.save();
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Favorite note PATCH
router.patch('/notes/:id/favorite', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    
    note.favorite = !note.favorite;
    await note.save();
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete note
router.delete('/notes/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// ==========================================
// FOCUS DEEP POMODORO TIMER APIs
// ==========================================

// Get all focus sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await FocusSession.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Log a completed focus session
router.post('/sessions', auth, async (req, res) => {
  try {
    const { sessionType, duration, completed } = req.body;
    const session = new FocusSession({
      userId: req.user._id,
      sessionType: sessionType || 'Focus',
      duration: duration || 25,
      completed: completed !== undefined ? completed : true
    });
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear all logged sessions
router.delete('/sessions', auth, async (req, res) => {
  try {
    await FocusSession.deleteMany({ userId: req.user._id });
    res.json({ message: 'Focus session history cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
