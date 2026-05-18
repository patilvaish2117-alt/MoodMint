import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { 
  Plus, 
  Trash2, 
  Pin, 
  Star, 
  Search, 
  Filter, 
  X, 
  Edit3, 
  Copy, 
  Maximize2, 
  Sparkles, 
  Calendar,
  BookOpen,
  Folder,
  TrendingUp,
  Clock,
  Check
} from 'lucide-react';

const CATEGORIES = ['Personal', 'Study', 'Ideas', 'Goals', 'Reminders', 'Random'];

const PASTEL_COLORS = [
  { name: 'Yellow', value: '#fef3c7', text: 'text-yellow-800', border: 'border-yellow-200' },
  { name: 'Pink', value: '#fce4ec', text: 'text-pink-800', border: 'border-pink-200' },
  { name: 'Lavender', value: '#f3e8ff', text: 'text-purple-800', border: 'border-purple-200' },
  { name: 'Blue', value: '#e0f2fe', text: 'text-blue-800', border: 'border-blue-200' },
  { name: 'Green', value: '#dcfce7', text: 'text-green-800', border: 'border-green-200' },
  { name: 'Peach', value: '#ffedd5', text: 'text-orange-800', border: 'border-orange-200' }
];

const Notes = () => {
  const { user } = useOutletContext();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search / Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  
  // Fullscreen view modal
  const [fullscreenNote, setFullscreenNote] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Personal');
  const [color, setColor] = useState('#fef3c7');
  const [pinned, setPinned] = useState(false);
  const [favorite, setFavorite] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Auto-save draft key
  const DRAFT_KEY = `moodmint_note_draft_${user?.id || 'guest'}`;

  useEffect(() => {
    fetchNotes();
    // Load draft if any
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setTitle(parsed.title || '');
        setContent(parsed.content || '');
        setCategory(parsed.category || 'Personal');
        setColor(parsed.color || '#fef3c7');
      } catch (e) {
        console.error('Failed to load draft', e);
      }
    }
  }, []);

  // Save draft to localStorage as user types
  useEffect(() => {
    if (title || content) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, category, color }));
    }
  }, [title, content, category, color]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/notes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotes(res.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load notes 😢', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditMode(false);
    // Clear draft if title/content are reset, or leave draft contents
    setTitle('');
    setContent('');
    setCategory('Personal');
    setColor('#fef3c7');
    setPinned(false);
    setFavorite(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note) => {
    setEditMode(true);
    setSelectedNoteId(note._id);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setColor(note.color);
    setPinned(note.pinned);
    setFavorite(note.favorite);
    setIsModalOpen(true);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const noteData = { title, content, category, color, pinned, favorite };

      if (editMode) {
        const res = await axios.put(`http://localhost:5000/api/notes/${selectedNoteId}`, noteData, config);
        setNotes(prev => prev.map(n => n._id === selectedNoteId ? res.data : n));
        addToast('Note updated! ✏️');
      } else {
        const res = await axios.post('http://localhost:5000/api/notes', noteData, config);
        setNotes(prev => [res.data, ...prev]);
        
        // Confetti!
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#fce4ec', '#f3e8ff', '#e0f2fe', '#fef3c7', '#dcfce7']
        });
        addToast('Note saved! 🌸');
      }
      
      // Clear auto-save draft
      localStorage.removeItem(DRAFT_KEY);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to save note 😢', 'error');
    }
  };

  const handleDeleteNote = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this note? 🗑️')) return;
    try {
      await axios.delete(`http://localhost:5000/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotes(prev => prev.filter(n => n._id !== id));
      addToast('Note deleted successfully.');
    } catch (err) {
      console.error(err);
      addToast('Failed to delete note 😢', 'error');
    }
  };

  const handleTogglePin = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await axios.patch(`http://localhost:5000/api/notes/${id}/pin`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotes(prev => prev.map(n => n._id === id ? res.data : n));
      addToast(res.data.pinned ? 'Note pinned! 📌' : 'Note unpinned.');
    } catch (err) {
      console.error(err);
      addToast('Failed to toggle pin 😢', 'error');
    }
  };

  const handleToggleFavorite = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await axios.patch(`http://localhost:5000/api/notes/${id}/favorite`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotes(prev => prev.map(n => n._id === id ? res.data : n));
      addToast(res.data.favorite ? 'Added to favorites! ⭐' : 'Removed from favorites.');
    } catch (err) {
      console.error(err);
      addToast('Failed to toggle favorite 😢', 'error');
    }
  };

  const handleCopyNote = (note, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    addToast('Note copied to clipboard! 📋');
  };

  // Math Calculations
  const pinnedNotes = notes.filter(n => n.pinned);
  const regularNotes = notes.filter(n => !n.pinned);
  const starredCount = notes.filter(n => n.favorite).length;

  // Filter & Sort Logic
  const processNotes = (list) => {
    return list
      .filter(n => {
        const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
        const matchCategory = categoryFilter === 'All' || n.category === categoryFilter;
        const matchPinFilter = !showPinnedOnly || n.pinned;
        const matchFavoriteFilter = !showFavoritesOnly || n.favorite;
        return matchSearch && matchCategory && matchPinFilter && matchFavoriteFilter;
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  };

  const displayPinned = processNotes(pinnedNotes);
  const displayRegular = processNotes(regularNotes);
  
  // Analytics variables
  const totalCount = notes.length;
  const pinnedCount = pinnedNotes.length;
  const categoriesCount = new Set(notes.map(n => n.category)).size;
  const recentCount = notes.filter(n => {
    const hours = Math.abs(new Date() - new Date(n.createdAt)) / 36e5;
    return hours <= 24;
  }).length;

  return (
    <div className="relative min-h-screen">
      {/* Background Blobs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-pastel-lavender rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-pastel-pink rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>

      {/* Header card */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
            Your Thoughts, Organized <span className="animate-bounce">💭</span>
          </h1>
          <p className="text-gray-500 mt-1">Capture ideas, reminders, dreams, and quick thoughts beautifully.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="px-4 py-2 glass rounded-2xl flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white/50">
            <BookOpen className="text-pastel-darkPink" size={18} />
            <span>Total Notes: {totalCount}</span>
          </div>
          <div className="px-4 py-2 glass rounded-2xl flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white/50">
            <Pin className="text-pastel-darkLavender" size={18} />
            <span>Pinned: {pinnedCount}</span>
          </div>
          <div className="px-4 py-2 glass rounded-2xl flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white/50">
            <Calendar className="text-pastel-darkPink" size={18} />
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6 relative z-10">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search through your thoughts..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/60 backdrop-blur-md border border-white focus:border-pastel-darkPink focus:ring-2 focus:ring-pastel-darkPink/20 rounded-2xl py-3 pl-11 pr-4 text-gray-700 outline-none transition-all placeholder-gray-400"
            />
          </div>

          {/* Category Filter dropdown */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none w-full sm:w-48 bg-white/60 backdrop-blur-md border border-white focus:border-pastel-darkPink rounded-2xl py-3 pl-4 pr-10 text-gray-700 outline-none transition-all cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <Folder className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>

        {/* Buttons / Favorites toggles */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
          <button 
            onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            className={`px-4 py-3 rounded-2xl border font-semibold text-sm transition-all flex items-center gap-2 ${
              showPinnedOnly 
                ? 'bg-pastel-lavender border-pastel-darkLavender text-pastel-darkLavender shadow-sm' 
                : 'bg-white/60 border-white text-gray-600 hover:bg-white'
            }`}
          >
            <Pin size={16} /> Pinned
          </button>
          
          <button 
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-4 py-3 rounded-2xl border font-semibold text-sm transition-all flex items-center gap-2 ${
              showFavoritesOnly 
                ? 'bg-pastel-pink border-pastel-darkPink text-pastel-darkPink shadow-sm' 
                : 'bg-white/60 border-white text-gray-600 hover:bg-white'
            }`}
          >
            <Star size={16} /> Stars ({starredCount})
          </button>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-white/60 backdrop-blur-md border border-white focus:border-pastel-darkPink rounded-2xl py-3 px-4 text-gray-700 outline-none transition-all cursor-pointer font-semibold text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          <button 
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender text-white font-bold px-6 py-3 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Create Note
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
        
        {/* Left Side: Pinned & Notes Grid */}
        <div className="lg:col-span-3 space-y-8">
          
          {loading ? (
            /* skeleton loader */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              {[1, 2, 4].map(i => (
                <div key={i} className="glass p-6 rounded-3xl h-56 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-5 bg-white/50 rounded w-2/3"></div>
                    <div className="h-3 bg-white/50 rounded w-full"></div>
                    <div className="h-3 bg-white/50 rounded w-5/6"></div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="h-4 bg-white/50 rounded w-1/4"></div>
                    <div className="w-10 h-10 bg-white/50 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Pinned Section */}
              {displayPinned.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                    Pinned Notes <Pin className="text-pastel-darkLavender" size={18} />
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence>
                      {displayPinned.map((note, index) => (
                        <NoteCard 
                          key={note._id} 
                          note={note} 
                          index={index} 
                          onEdit={handleOpenEditModal} 
                          onDelete={handleDeleteNote}
                          onPin={handleTogglePin}
                          onFavorite={handleToggleFavorite}
                          onFullscreen={setFullscreenNote}
                          onCopy={handleCopyNote}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Regular Notes Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-700">
                  {displayPinned.length > 0 ? 'All Other Notes ✏️' : 'All Notes ✏️'}
                </h2>
                
                {displayRegular.length > 0 || displayPinned.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence>
                      {displayRegular.map((note, index) => (
                        <NoteCard 
                          key={note._id} 
                          note={note} 
                          index={index} 
                          onEdit={handleOpenEditModal} 
                          onDelete={handleDeleteNote}
                          onPin={handleTogglePin}
                          onFavorite={handleToggleFavorite}
                          onFullscreen={setFullscreenNote}
                          onCopy={handleCopyNote}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* Empty state UI */
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass p-12 text-center rounded-3xl flex flex-col items-center justify-center gap-6"
                  >
                    <div className="w-28 h-28 bg-gradient-to-tr from-pastel-pink to-pastel-lavender rounded-full flex items-center justify-center shadow-inner relative overflow-hidden animate-pulse">
                      <span className="text-6xl z-10">🌸</span>
                      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-gray-800">Your mind is full of ideas. Start writing 🌸</h3>
                      <p className="text-gray-500 mt-2 max-w-sm mx-auto">Scribble down your thoughts, goals, lists or personal journal logs in a beautifully customizable aesthetic layout.</p>
                    </div>
                    <button 
                      onClick={handleOpenAddModal}
                      className="bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                      Create First Note
                    </button>
                  </motion.div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Right Side: Analytics & Details */}
        <div className="space-y-6">
          {/* Notes Analytics Summary */}
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-lg font-bold text-gray-800 border-b border-white/30 pb-3 flex items-center gap-2">
              <TrendingUp className="text-pastel-darkPink" size={18} /> Writing Stats & Vibe Check
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/40 p-4 rounded-2xl border border-white/50 text-center">
                <span className="text-xs font-bold text-gray-400 block uppercase">Drafts</span>
                <span className="text-2xl font-extrabold text-gray-800">{totalCount}</span>
              </div>
              <div className="bg-white/40 p-4 rounded-2xl border border-white/50 text-center">
                <span className="text-xs font-bold text-gray-400 block uppercase">Pinned</span>
                <span className="text-2xl font-extrabold text-gray-800">{pinnedCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/40 p-4 rounded-2xl border border-white/50">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                <Sparkles size={24} />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-800 block">Categories Used</span>
                <span className="text-xs text-gray-500">{categoriesCount} / {CATEGORIES.length} distinct vibes</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/40 p-4 rounded-2xl border border-white/50">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                <Clock size={24} />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-800 block">Added in 24 hours</span>
                <span className="text-xs text-gray-500">{recentCount} new note{recentCount !== 1 ? 's' : ''} logged</span>
              </div>
            </div>
          </div>

          {/* Quick Writing Tips Panel */}
          <div className="glass-card p-6 bg-gradient-to-tr from-pastel-pink/20 to-pastel-lavender/20 border-none text-center">
            <h4 className="text-xs font-bold text-pastel-darkPink uppercase tracking-wider mb-2">Self-Care Check-in 🌿</h4>
            <p className="text-sm text-gray-700 italic">
              "Journaling is the easiest way to download your brain, organize your priorities, and protect your peace."
            </p>
          </div>
        </div>

      </div>

      {/* Edit / Add Note Modal */}
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
              className="glass p-6 w-full max-w-lg relative z-10 shadow-2xl overflow-hidden"
              style={{ borderTop: `6px solid ${color}` }}
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 hover:bg-white/40 rounded-xl transition-all text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-extrabold text-gray-800 mb-6">
                {editMode ? 'Edit Thought ✏️' : 'Capture Thought 💭'}
              </h2>

              <form onSubmit={handleSaveNote} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Title</label>
                  <input 
                    type="text" 
                    placeholder="E.g. Dream log, Study Schedule" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full bg-white/60 border border-white/40 focus:border-pastel-darkPink rounded-xl py-3 px-4 text-gray-700 outline-none transition-all placeholder-gray-400 focus:ring-2 focus:ring-pastel-darkPink/20"
                  />
                </div>

                {/* Category Selection */}
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
                  
                  {/* Pin / Fav Flags */}
                  <div className="flex gap-4 items-center pt-5 pl-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600 font-semibold cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={pinned} 
                        onChange={(e) => setPinned(e.target.checked)}
                        className="rounded border-gray-300 text-pastel-darkLavender focus:ring-pastel-darkLavender"
                      />
                      <span>Pin Note</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600 font-semibold cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={favorite} 
                        onChange={(e) => setFavorite(e.target.checked)}
                        className="rounded border-gray-300 text-pastel-darkPink focus:ring-pastel-darkPink"
                      />
                      <span>Favorite</span>
                    </label>
                  </div>
                </div>

                {/* Content Textarea */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-500 uppercase block">Content</label>
                    <span className="text-xs text-gray-400">{content.length} characters</span>
                  </div>
                  <textarea 
                    placeholder="Start typing your aesthetic notes here..." 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={6}
                    className="w-full bg-white/60 border border-white/40 focus:border-pastel-darkPink rounded-xl py-3 px-4 text-gray-700 outline-none transition-all placeholder-gray-400 focus:ring-2 focus:ring-pastel-darkPink/20 resize-y"
                  />
                </div>

                {/* Pastel Color Selector */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Note Background Color</label>
                  <div className="flex gap-2">
                    {PASTEL_COLORS.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setColor(c.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          color === c.value ? 'border-gray-600 scale-110 shadow-sm' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender text-white font-bold rounded-xl py-3.5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all mt-4"
                >
                  {editMode ? 'Save Changes' : 'Save Thought'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen view modal */}
      <AnimatePresence>
        {fullscreenNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFullscreenNote(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl glass p-8 relative z-10 shadow-2xl overflow-y-auto max-h-[85vh] rounded-3xl"
              style={{ backgroundColor: fullscreenNote.color }}
            >
              <button 
                onClick={() => setFullscreenNote(null)}
                className="absolute right-6 top-6 p-2 bg-white/40 hover:bg-white/80 rounded-full transition-all text-gray-600"
              >
                <X size={20} />
              </button>

              <div className="flex gap-2 mb-3">
                <span className="text-xs px-3 py-1 bg-white/60 text-gray-800 rounded-full font-bold uppercase">
                  {fullscreenNote.category}
                </span>
                <span className="text-xs text-gray-500 pt-1 font-semibold">
                  Captured {new Date(fullscreenNote.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
                </span>
              </div>

              <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b border-black/10 pb-4">
                {fullscreenNote.title}
              </h2>

              <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                {fullscreenNote.content}
              </p>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-black/10">
                <button 
                  onClick={(e) => { handleCopyNote(fullscreenNote, e); }}
                  className="px-5 py-2.5 bg-white/80 hover:bg-white rounded-xl text-gray-700 font-semibold text-sm transition-all flex items-center gap-2"
                >
                  <Copy size={16} /> Copy content
                </button>
                <button 
                  onClick={() => setFullscreenNote(null)}
                  className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-semibold text-sm transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification Container */}
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

// Internal Subcomponent NoteCard for individual Sticky Note design
const NoteCard = ({ note, index, onEdit, onDelete, onPin, onFavorite, onFullscreen, onCopy }) => {
  // Alternate rotations slightly for the realistic stickynote vibe
  const rotation = index % 3 === 0 ? 'rotate-1' : index % 3 === 1 ? '-rotate-1' : 'rotate-[0.5deg]';
  const colorTheme = PASTEL_COLORS.find(c => c.value === note.color) || PASTEL_COLORS[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5, scale: 1.01 }}
      onClick={() => onFullscreen(note)}
      className={`relative p-6 rounded-3xl border border-black/5 shadow-md flex flex-col justify-between min-h-[220px] transition-all cursor-pointer ${rotation}`}
      style={{ backgroundColor: note.color }}
    >
      <div>
        {/* Card Top Actions */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <span className="text-xs px-2.5 py-0.5 bg-white/60 text-gray-800 rounded-full font-bold uppercase tracking-wider">
            {note.category}
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => onPin(note._id, e)} 
              className={`p-1.5 hover:bg-white/30 rounded-lg transition-colors ${note.pinned ? 'text-pastel-darkLavender' : 'text-gray-400'}`}
              title="Pin Note"
            >
              <Pin size={16} className={note.pinned ? 'fill-current' : ''} />
            </button>
            <button 
              onClick={(e) => onFavorite(note._id, e)} 
              className={`p-1.5 hover:bg-white/30 rounded-lg transition-colors ${note.favorite ? 'text-pastel-darkPink' : 'text-gray-400'}`}
              title="Star Note"
            >
              <Star size={16} className={note.favorite ? 'fill-current' : ''} />
            </button>
          </div>
        </div>

        {/* Note Body */}
        <h3 className="text-lg font-extrabold text-gray-800 leading-tight mb-2 pr-4 truncate">
          {note.title}
        </h3>
        
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 whitespace-pre-wrap font-medium">
          {note.content}
        </p>
      </div>

      {/* Card Bottom Controls */}
      <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
        <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
          <Calendar size={12} />
          {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={(e) => onCopy(note, e)}
            className="p-2 text-gray-400 hover:text-gray-700 bg-white/40 hover:bg-white rounded-xl shadow-sm border border-white/20 transition-all"
            title="Copy Note"
          >
            <Copy size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(note); }}
            className="p-2 text-gray-400 hover:text-pastel-darkLavender bg-white/40 hover:bg-white rounded-xl shadow-sm border border-white/20 transition-all"
            title="Edit Note"
          >
            <Edit3 size={14} />
          </button>
          <button 
            onClick={(e) => onDelete(note._id, e)}
            className="p-2 text-gray-400 hover:text-red-500 bg-white/40 hover:bg-white rounded-xl shadow-sm border border-white/20 transition-all"
            title="Delete Note"
          >
            <Trash2 size={14} />
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-gray-800 bg-white/40 hover:bg-white rounded-xl shadow-sm border border-white/20 transition-all"
            title="Read Note"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

    </motion.div>
  );
};

export default Notes;
