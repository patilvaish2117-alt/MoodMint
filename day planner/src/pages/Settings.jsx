import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Sparkles, Moon, Volume2 } from 'lucide-react';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Get logged-in user info
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleToggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const handleToggleNotifications = () => {
    setNotifyEnabled(!notifyEnabled);
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header Panel */}
      <div className="glass-card p-6">
        <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
          Settings ⚙️
        </h1>
        <p className="text-gray-500 mt-1">Configure your personal aesthetics and app preferences.</p>
      </div>

      {/* Profile Details */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b border-white/30 pb-3">
          <User className="text-pastel-darkPink" size={20} /> User Profile
        </h2>
        <div className="flex items-center gap-4 py-2">
          <div className="w-16 h-16 rounded-full bg-pastel-pink text-pastel-darkPink font-bold text-2xl flex items-center justify-center">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Preferences Settings */}
      <div className="glass-card p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b border-white/30 pb-3">
          <Sparkles className="text-pastel-darkLavender" size={20} /> Preferences
        </h2>

        {/* Sound toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="text-gray-500" size={20} />
            <div>
              <p className="text-sm font-bold text-gray-800">Sound Effects</p>
              <p className="text-xs text-gray-500">Play chimes and bells upon habit completion.</p>
            </div>
          </div>
          <button 
            onClick={handleToggleSound}
            className={`w-12 h-6 rounded-full p-1 transition-all ${soundEnabled ? 'bg-pastel-darkPink' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-all ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Notifications toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="text-gray-500" size={20} />
            <div>
              <p className="text-sm font-bold text-gray-800">Push Notifications</p>
              <p className="text-xs text-gray-500">Get reminders for your daily habits.</p>
            </div>
          </div>
          <button 
            onClick={handleToggleNotifications}
            className={`w-12 h-6 rounded-full p-1 transition-all ${notifyEnabled ? 'bg-pastel-darkPink' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-all ${notifyEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Dark Mode Theme toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon className="text-gray-500" size={20} />
            <div>
              <p className="text-sm font-bold text-gray-800">Aesthetic Dark Theme</p>
              <p className="text-xs text-gray-500">Enable soft pastel dark colors.</p>
            </div>
          </div>
          <button 
            onClick={handleToggleDarkMode}
            className={`w-12 h-6 rounded-full p-1 transition-all ${darkMode ? 'bg-pastel-darkPink' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-all ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Account Info Security */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b border-white/30 pb-3">
          <Shield className="text-green-500" size={20} /> Security & Account
        </h2>
        <div className="flex justify-between items-center py-2">
          <div>
            <p className="text-sm font-bold text-gray-800">Account Type</p>
            <p className="text-xs text-gray-500">MoodMint College Free Student tier</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-green-100 text-green-700 rounded-full uppercase">
            Active
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
