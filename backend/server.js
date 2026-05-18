require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
// For a college project, using a local DB or placeholder is fine. We will use local mongodb if MONGO_URI is not set.
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/moodmint')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
