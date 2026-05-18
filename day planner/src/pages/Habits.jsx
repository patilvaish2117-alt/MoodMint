import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { 
  Plus, 
  Trash2, 
  Check, 
  Search, 
  Filter, 
  Flame, 
  Sparkles, 
  TrendingUp, 
  BookOpen, 
  Calendar, 
  Edit3, 
  X, 
  Percent, 
  Award,
  Zap,
  Coffee,
  Heart,
  Smile,
  Activity,
  ChevronDown
} from 'lucide-react';

const CATEGORIES = ['Fitness', 'Mindfulness', 'Study', 'Health', 'Creative', 'Social', 'General'];

const EMOJIS = ['🌱', '💪', '🧘', '📚', '🍎', '🎨', '💧', '🏃', '💤', '🧠', '✨', '🍵', '💖', '🎵'];

const PASTEL_THEMES = [
  { name: 'Pink', bg: 'bg-pink-100', border: 'border-pink-200', text: 'text-pink-600', active: 'bg-pink-200' },
  { name: 'Lavender', bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-600', active: 'bg-purple-200' },
  { name: 'Blue', bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-600', active: 'bg-blue-200' },
  { name: 'Yellow', bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-600', active: 'bg-yellow-200' },
  { name: 'Green', bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-600', active: 'bg-green-200' }
];

const QUOTES = [
  "Consistency beats motivation 🌸",
  "One step every day matters ✨",
  "Your future is built by your habits 💖",
  "Protect your peace, track your habits 🍃",
  "Slow progress is still progress 💫",
  "Make today count for your future self 🌱"
];

const Habits = () => {
  const { user } = useOutletContext();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Completed, Incomplete
  const [sortBy, setSortBy] = useState('newest'); // newest, streak
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [emoji, setEmoji] = useState('🌱');
  const [frequency, setFrequency] = useState('Daily');
  const [themeColor, setThemeColor] = useState('Blue');

  // Quotes state
  const [quote, setQuote] = useState('');

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetchHabits();
    // Set random quote
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const res = await axios.get('https://moodmint-ozqw.onrender.com/api/habits', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setHabits(res.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load habits 😢', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditMode(false);
    setTitle('');
    setCategory('General');
    setEmoji('🌱');
    setFrequency('Daily');
    setThemeColor('Blue');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (habit) => {
    setEditMode(true);
    setSelectedHabitId(habit._id);
    setTitle(habit.title);
    setCategory(habit.category);
    setEmoji(habit.emoji);
    setFrequency(habit.frequency);
    // Find theme color if possible
    setThemeColor('Blue'); // Fallback
    setIsModalOpen(true);
  };

  const handleSaveHabit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const habitData = { title, category, frequency, emoji };

      if (editMode) {
        const res = await axios.put(`https://moodmint-ozqw.onrender.com/api/habits/${selectedHabitId}`, habitData, config);
        setHabits(prev => prev.map(h => h._id === selectedHabitId ? res.data : h));
        addToast('Habit updated successfully! ✨');
      } else {
        const res = await axios.post('https://moodmint-ozqw.onrender.com/api/habits', habitData, config);
        setHabits(prev => [res.data, ...prev]);
        addToast('New habit created! 🌱');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Error saving habit 😢', 'error');
    }
  };

  const handleDeleteHabit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this habit? 🗑️')) return;
    try {
      await axios.delete(`https://moodmint-ozqw.onrender.com/api/habits/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setHabits(prev => prev.filter(h => h._id !== id));
      addToast('Habit deleted successfully.');
    } catch (err) {
      console.error(err);
      addToast('Failed to delete habit 😢', 'error');
    }
  };

  const handleToggleComplete = async (id, currentCompleted) => {
    try {
      const res = await axios.patch(`https://moodmint-ozqw.onrender.com/api/habits/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setHabits(prev => prev.map(h => h._id === id ? res.data : h));

      if (!currentCompleted) {
        // Trigger confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.8 },
          colors: ['#f472b6', '#a855f7', '#38bdf8', '#fbbf24', '#34d399']
        });
        addToast('Streak updated! Awesome job! 🔥');
      } else {
        addToast('Marked as incomplete.');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to complete habit 😢', 'error');
    }
  };

  // Math & Analytics Calculations
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.completed).length;
  const longestStreak = habits.length ? Math.max(...habits.map(h => h.streak), 0) : 0;
  const weeklyProgress = habits.length ? Math.round((habits.reduce((acc, h) => acc + h.progress, 0) / (habits.length * 100)) * 100) : 0;
  const consistencyScore = habits.length ? Math.min(Math.round((completedToday / totalHabits) * 100), 100) : 0;

  // Filter & Sort Processing
  const filteredHabits = habits
    .filter(h => {
      const matchSearch = h.title.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'All' || h.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || 
        (statusFilter === 'Completed' && h.completed) || 
        (statusFilter === 'Incomplete' && !h.completed);
      return matchSearch && matchCategory && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'streak') return b.streak - a.streak;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="relative min-h-screen">
      {/* Background Glow Blobs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-pastel-pink rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-pastel-blue rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>

      {/* Header Panel */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
            Build Better Habits <span className="animate-bounce">🌱</span>
          </h1>
          <p className="text-gray-500 mt-1">Small consistent actions create big life changes.</p>
        </div>
        
        {/* Header Stats widget */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="px-4 py-2 glass rounded-2xl flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Flame className="text-orange-500 animate-pulse" size={18} />
            <span>Top Streak: {longestStreak} days</span>
          </div>
          <div className="px-4 py-2 glass rounded-2xl flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Percent className="text-pastel-darkLavender" size={18} />
            <span>Today's Progress: {consistencyScore}%</span>
          </div>
          <div className="px-4 py-2 glass rounded-2xl flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white/50">
            <Calendar className="text-pastel-darkPink" size={18} />
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </motion.div>

      {/* Search, Filters and Sort Options */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6 relative z-10">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search habits..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/60 backdrop-blur-md border border-white focus:border-pastel-darkPink focus:ring-2 focus:ring-pastel-darkPink/20 rounded-2xl py-2.5 pl-11 pr-4 text-gray-700 outline-none transition-all placeholder-gray-400"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none w-full sm:w-48 bg-white/60 backdrop-blur-md border border-white focus:border-pastel-darkPink rounded-2xl py-2.5 pl-4 pr-10 text-gray-700 outline-none transition-all cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>

        {/* Sort & Status Filter */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white/60 backdrop-blur-md border border-white focus:border-pastel-darkPink rounded-2xl py-2.5 pl-4 pr-10 text-gray-700 outline-none transition-all cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed Today</option>
              <option value="Incomplete">Incomplete Today</option>
            </select>
            <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white/60 backdrop-blur-md border border-white focus:border-pastel-darkPink rounded-2xl py-2.5 pl-4 pr-10 text-gray-700 outline-none transition-all cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="streak">Highest Streak</option>
            </select>
            <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
          </div>

          <button 
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender text-white font-bold px-6 py-2.5 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Add Habit
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative z-10">
        
        {/* Habits list cards */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            // Skeleton Loader
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass p-6 rounded-3xl animate-pulse flex items-center justify-between gap-4 h-32">
                  <div className="flex items-center gap-4 w-2/3">
                    <div className="w-14 h-14 bg-white/50 rounded-2xl"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-white/50 rounded w-1/2"></div>
                      <div className="h-3 bg-white/50 rounded w-1/4"></div>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white/50 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : filteredHabits.length > 0 ? (
            <AnimatePresence>
              {filteredHabits.map(habit => {
                const isCompleted = habit.completed;
                return (
                  <motion.div
                    key={habit._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className={`glass-card p-5 relative overflow-hidden transition-all duration-300 border-l-4 ${
                      isCompleted ? 'border-l-green-400 bg-white/40' : 'border-l-pastel-darkPink bg-white/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Left: Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/80 border border-white/50 shadow-sm flex items-center justify-center text-3xl">
                          {habit.emoji}
                        </div>
                        <div>
                          <h3 className={`text-lg font-bold text-gray-800 flex items-center gap-2 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                            {habit.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-pastel-pink/50 text-pastel-darkPink">
                              {habit.category}
                            </span>
                            <span className="text-xs text-gray-400">
                              Created {new Date(habit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Actions & Completion */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0">
                        {/* Streak Badge */}
                        <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                          <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={18} />
                          <span className="text-sm font-extrabold text-orange-600">{habit.streak} 🔥</span>
                        </div>

                        {/* Completion Percentage */}
                        <div className="text-right">
                          <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Progress</span>
                          <span className="text-sm font-extrabold text-pastel-darkLavender">{habit.progress}%</span>
                        </div>

                        {/* Controls (Edit / Delete) */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleOpenEditModal(habit)}
                            className="p-2 text-gray-400 hover:text-pastel-darkLavender bg-white/70 hover:bg-white rounded-xl shadow-sm border border-white/30 transition-all"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteHabit(habit._id)}
                            className="p-2 text-gray-400 hover:text-red-500 bg-white/70 hover:bg-white rounded-xl shadow-sm border border-white/30 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Big Interactive Checkbox */}
                        <button
                          onClick={() => handleToggleComplete(habit._id, isCompleted)}
                          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                            isCompleted 
                              ? 'bg-gradient-to-tr from-green-400 to-emerald-400 border-green-300 text-white shadow-md shadow-green-200' 
                              : 'bg-white/80 border-gray-300 hover:border-pastel-darkPink text-transparent'
                          }`}
                        >
                          <Check size={24} className="stroke-[3]" />
                        </button>
                      </div>

                    </div>

                    {/* Progress Bar inside Card */}
                    <div className="mt-4 pt-3 border-t border-white/20">
                      <div className="h-2 w-full bg-white/40 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender"
                          initial={{ width: 0 }}
                          animate={{ width: `${habit.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            /* Empty State */
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-12 text-center rounded-3xl flex flex-col items-center justify-center gap-6"
            >
              <div className="w-28 h-28 bg-gradient-to-tr from-pastel-pink to-pastel-lavender rounded-full flex items-center justify-center shadow-inner relative overflow-hidden animate-pulse">
                <span className="text-6xl z-10">🌱</span>
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-full"></div>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-gray-800">Start your first habit journey 🌱</h3>
                <p className="text-gray-500 mt-2 max-w-sm mx-auto">Track your daily acts of growth and protect your mental aesthetic.</p>
              </div>
              <button 
                onClick={handleOpenAddModal}
                className="bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Add First Habit
              </button>
            </motion.div>
          )}
        </div>

        {/* Right Side Pane: Analytics & Motivation */}
        <div className="space-y-6">
          
          {/* Analytics Widgets */}
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-lg font-bold text-gray-800 border-b border-white/30 pb-3 flex items-center gap-2">
              <TrendingUp className="text-pastel-darkPink" size={18} /> Habit Stats & Analytics
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/40 p-4 rounded-2xl border border-white/50">
                <span className="text-xs font-bold text-gray-400 block uppercase">Total</span>
                <span className="text-2xl font-extrabold text-gray-800">{totalHabits}</span>
              </div>
              <div className="bg-white/40 p-4 rounded-2xl border border-white/50">
                <span className="text-xs font-bold text-gray-400 block uppercase">Done Today</span>
                <span className="text-2xl font-extrabold text-gray-800">{completedToday}</span>
              </div>
            </div>

            {/* Weekly Consistency Score (radial progress) */}
            <div className="flex items-center gap-4 bg-white/40 p-4 rounded-2xl border border-white/50">
              <div className="relative w-16 h-16 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/40"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <motion.path
                    className="text-pastel-darkLavender"
                    strokeWidth="3.5"
                    strokeDasharray={`${weeklyProgress}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: weeklyProgress / 100 }}
                    transition={{ duration: 0.8 }}
                  />
                </svg>
                <span className="absolute text-sm font-extrabold text-gray-700">{weeklyProgress}%</span>
              </div>
              <div>
                <span className="text-sm font-bold text-gray-800 block">Weekly Progress</span>
                <span className="text-xs text-gray-500">Your total consistency over the last 7 days.</span>
              </div>
            </div>

            {/* Consistency Index Widget */}
            <div className="bg-white/40 p-4 rounded-2xl border border-white/50 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span>Consistency Score</span>
                <span className="text-pastel-darkPink">{consistencyScore}%</span>
              </div>
              <div className="h-2 w-full bg-white/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender transition-all duration-500" 
                  style={{ width: `${consistencyScore}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 italic">
                {consistencyScore >= 80 ? 'Incredible vibe today! 💫' : consistencyScore >= 50 ? 'Steady growth, keep at it! ✨' : 'One step at a time! 🍃'}
              </span>
            </div>
          </div>

          {/* Motivational Rotating Quote Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-card p-6 bg-gradient-to-tr from-pastel-pink/20 to-pastel-lavender/20 border-none text-center shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-bl-full flex items-center justify-center">
              <Sparkles className="text-pastel-darkPink animate-spin-slow" size={16} />
            </div>
            <h4 className="text-xs font-bold text-pastel-darkPink uppercase tracking-wider mb-2">Vibe Check</h4>
            <p className="text-base font-medium text-gray-700 italic">
              "{quote}"
            </p>
          </motion.div>

        </div>
      </div>

      {/* Add / Edit Habit Modal Dialog */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="glass p-6 w-full max-w-md relative z-10 shadow-2xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 hover:bg-white/40 rounded-xl transition-all text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-extrabold text-gray-800 mb-6">
                {editMode ? 'Edit Habit ✏️' : 'Add Habit 🌱'}
              </h2>

              <form onSubmit={handleSaveHabit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Habit Title</label>
                  <input 
                    type="text" 
                    placeholder="E.g. Drink 3L water, Meditate" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full bg-white/60 border border-white/40 focus:border-pastel-darkPink rounded-xl py-3 px-4 text-gray-700 outline-none transition-all placeholder-gray-400 focus:ring-2 focus:ring-pastel-darkPink/20"
                  />
                </div>

                {/* Category & Frequency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white/60 border border-white/40 focus:border-pastel-darkPink rounded-xl py-3 px-3 text-gray-700 outline-none cursor-pointer"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full bg-white/60 border border-white/40 focus:border-pastel-darkPink rounded-xl py-3 px-3 text-gray-700 outline-none cursor-pointer"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                {/* Emoji Selector */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Pick an Emoji</label>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-white/40 border border-white/40 rounded-xl">
                    {EMOJIS.map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setEmoji(em)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl transition-all ${
                          emoji === em ? 'bg-pastel-darkPink/20 border border-pastel-darkPink' : 'hover:bg-white/40'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Theme Selector */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Color Theme</label>
                  <div className="flex gap-2">
                    {PASTEL_THEMES.map(theme => (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() => setThemeColor(theme.name)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${theme.bg} ${
                          themeColor === theme.name ? 'border-gray-600 scale-110 shadow-sm' : 'border-transparent'
                        }`}
                        title={theme.name}
                      />
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender text-white font-bold rounded-xl py-3.5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all mt-4"
                >
                  {editMode ? 'Save Changes' : 'Create Habit'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification Grid */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-4 rounded-xl shadow-xl flex items-center gap-3 border ${
                toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-green-100 text-gray-700'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
              }`}>
                {toast.type === 'error' ? <X size={12} /> : <Check size={12} />}
              </div>
              <span className="font-semibold text-sm">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default Habits;
