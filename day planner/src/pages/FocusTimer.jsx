import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Settings2, 
  Music, 
  CheckSquare, 
  BarChart2, 
  Flame, 
  Calendar, 
  Sparkles, 
  Clock, 
  X, 
  Check, 
  Volume2, 
  VolumeX, 
  HelpCircle,
  Minimize2,
  Maximize2
} from 'lucide-react';

const QUOTES = [
  "Distraction steals dreams ✨",
  "One focused hour changes everything 🌱",
  "Your future is built in moments of focus 💖",
  "Protect your peace, conquer your goals 🎧",
  "Focus on being productive, not busy 🍃",
  "Energy flows where attention goes ⚡"
];

const FocusTimer = () => {
  const { user } = useOutletContext();
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  
  // Timer configurations (in minutes)
  const [focusDur, setFocusDur] = useState(25);
  const [shortBreakDur, setShortBreakDur] = useState(5);
  const [longBreakDur, setLongBreakDur] = useState(15);
  
  // Settings Panel state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);

  // Timer Core States
  const [mode, setMode] = useState('Focus'); // 'Focus', 'Short Break', 'Long Break'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [totalTimeLeft, setTotalTimeLeft] = useState(25 * 60); // Used for progress calculations
  
  // Ambient Focus States
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [quote, setQuote] = useState('');
  
  // Music Synth state
  const [activeAmbient, setActiveAmbient] = useState(null); // 'Lofi', 'Rain', 'Nature', 'Piano'
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  // Interactive gamified states
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Refs for audio context and synth oscillators
  const audioCtxRef = useRef(null);
  const synthNodesRef = useRef([]);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    fetchSessions();
    fetchTasks();
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    
    // Load local level stats
    const savedXp = localStorage.getItem(`moodmint_xp_${user?.id || 'guest'}`);
    const savedLevel = localStorage.getItem(`moodmint_level_${user?.id || 'guest'}`);
    if (savedXp) setXp(parseInt(savedXp));
    if (savedLevel) setLevel(parseInt(savedLevel));

    return () => {
      stopAmbientSynth();
      clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Update timer remaining seconds when durations are customized
  useEffect(() => {
    if (!isRunning) {
      const minutes = mode === 'Focus' ? focusDur : mode === 'Short Break' ? shortBreakDur : longBreakDur;
      setTimeLeft(minutes * 60);
      setTotalTimeLeft(minutes * 60);
    }
  }, [focusDur, shortBreakDur, longBreakDur, mode]);

  // Live Timer Clock Interval Logic
  useEffect(() => {
    if (isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isRunning]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('https://moodmint-ozqw.onrender.com/api/sessions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSessions(res.data);
      
      // Calculate simple daily streak from historical focus dates
      if (res.data.length > 0) {
        const dates = res.data.map(s => new Date(s.createdAt).toDateString());
        const distinctDates = [...new Set(dates)];
        setStreak(distinctDates.length);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load focus sessions 😢', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get('https://moodmint-ozqw.onrender.com/api/tasks', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTasks(res.data.filter(t => !t.completed));
    } catch (err) {
      console.error(err);
    }
  };

  // Browser Web Audio API Sound and Ambient synthesizer
  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Play soft focus alert sound (web synth chime)
  const playAlertChime = () => {
    if (!soundEnabled) return;
    try {
      initAudioCtx();
      const ctx = audioCtxRef.current;
      
      // Harmonic synth progression
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
        
        gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + index * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.1 + 0.8);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.1);
        osc.stop(ctx.currentTime + index * 0.1 + 1.0);
      });
    } catch (e) {
      console.error('Audio synth error', e);
    }
  };

  // Synthesis for Ambient Sounds (Lofi warm keys, rain noise, nature forest tone, sweet piano chords)
  const startAmbientSynth = (type) => {
    stopAmbientSynth();
    try {
      initAudioCtx();
      const ctx = audioCtxRef.current;
      setIsMusicPlaying(true);

      if (type === 'Rain') {
        // Rain Synth: Dynamic white noise filter sweep
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(450, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);

        whiteNoise.connect(lowpass);
        lowpass.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start();
        synthNodesRef.current = [whiteNoise, lowpass, gainNode];

      } else if (type === 'Nature') {
        // Nature Synth: Wind + chirps synthesis
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(95, ctx.currentTime); // Deep humming

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.5, ctx.currentTime); // Slow sweep

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(25, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        lfo.start();
        osc.start();
        synthNodesRef.current = [osc, lfo, lfoGain, gainNode];

      } else if (type === 'Lofi' || type === 'Piano') {
        // Soft electric piano synthesized repeating loop
        const timerId = setInterval(() => {
          if (!isMusicPlaying) return;
          
          const now = ctx.currentTime;
          // Simple GenZ lofi minor 7th progression: Am7 -> Dm7 -> G7 -> Cmaj7
          const chords = [
            [220, 261.63, 329.63, 392.00], // Am7
            [146.83, 293.66, 349.23, 440.00], // Dm7
            [196.00, 293.66, 392.00, 493.88]  // G7
          ];
          const chosenChord = chords[Math.floor(Math.random() * chords.length)];
          
          chosenChord.forEach(f => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = f;
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + 3.2);
          });
        }, 3200);

        synthNodesRef.current = [{ stop: () => clearInterval(timerId) }];
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stopAmbientSynth = () => {
    setIsMusicPlaying(false);
    if (synthNodesRef.current.length > 0) {
      synthNodesRef.current.forEach(node => {
        try {
          if (node.stop) node.stop();
        } catch (e) {}
      });
      synthNodesRef.current = [];
    }
  };

  const handleToggleAmbient = (ambientType) => {
    if (activeAmbient === ambientType && isMusicPlaying) {
      stopAmbientSynth();
      setActiveAmbient(null);
    } else {
      setActiveAmbient(ambientType);
      startAmbientSynth(ambientType);
      addToast(`Ambient playing: ${ambientType} 🎧`);
    }
  };

  // Timer complete handler
  const handleSessionComplete = async () => {
    setIsRunning(false);
    playAlertChime();
    
    // Confetti burst
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.7 }
    });

    const isFocus = mode === 'Focus';
    
    // Award XP
    const gainedXp = isFocus ? 100 : 30;
    const newXp = xp + gainedXp;
    let newLevel = level;
    
    // Level up algorithm (every 500 XP is 1 level)
    if (newXp >= level * 500) {
      newLevel += 1;
      addToast(`LEVEL UP! You are now level ${newLevel}! 🏆`, 'success');
      confetti({ particleCount: 200, spread: 120 });
    }

    setXp(newXp);
    setLevel(newLevel);
    localStorage.setItem(`moodmint_xp_${user?.id || 'guest'}`, newXp);
    localStorage.setItem(`moodmint_level_${user?.id || 'guest'}`, newLevel);

    // Save session to Mongo
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const durationVal = isFocus ? focusDur : mode === 'Short Break' ? shortBreakDur : longBreakDur;
      await axios.post('https://moodmint-ozqw.onrender.com/api/sessions', {
        sessionType: mode,
        duration: durationVal,
        completed: true
      }, config);
      
      addToast(`${mode} logged! +${gainedXp} Focus XP ⚡`);
      
      // Auto complete selected task if checked
      if (isFocus && selectedTaskId) {
        await axios.put(`https://moodmint-ozqw.onrender.com/api/tasks/${selectedTaskId}`, 
          { completed: true },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
        );
        addToast('Connected task completed successfully! ✅');
        fetchTasks();
        setSelectedTaskId('');
      }

      fetchSessions();
    } catch (err) {
      console.error(err);
    }

    // Propose auto break toggle
    if (isFocus) {
      setMode('Short Break');
      setTimeLeft(shortBreakDur * 60);
      setTotalTimeLeft(shortBreakDur * 60);
      if (autoStartBreaks) setIsRunning(true);
    } else {
      setMode('Focus');
      setTimeLeft(focusDur * 60);
      setTotalTimeLeft(focusDur * 60);
    }
  };

  const handleStartPause = () => {
    initAudioCtx();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    const minutes = mode === 'Focus' ? focusDur : mode === 'Short Break' ? shortBreakDur : longBreakDur;
    setTimeLeft(minutes * 60);
    setTotalTimeLeft(minutes * 60);
    addToast('Timer reset.');
  };

  const handleSkip = () => {
    if (window.confirm('Skip this focus session? ⏭️')) {
      handleSessionComplete();
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Clear focus session history? 🗑️')) {
      try {
        await axios.delete('https://moodmint-ozqw.onrender.com/api/sessions', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setSessions([]);
        setStreak(0);
        addToast('History cleared.');
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Clock format helpers
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progressPercentage = ((totalTimeLeft - timeLeft) / totalTimeLeft) * 100;
  
  // Analytics
  const completedToday = sessions.filter(s => {
    const today = new Date().toDateString();
    return new Date(s.createdAt).toDateString() === today && s.sessionType === 'Focus';
  }).length;

  const totalFocusMin = sessions
    .filter(s => s.sessionType === 'Focus')
    .reduce((acc, curr) => acc + curr.duration, 0);

  const totalFocusHrs = (totalFocusMin / 60).toFixed(1);

  // Badge System
  const getBadge = (lvl) => {
    if (lvl >= 10) return { name: 'Focus Master 🧘', color: 'bg-indigo-100 text-indigo-700' };
    if (lvl >= 5) return { name: 'Focus Scholar 📚', color: 'bg-purple-100 text-purple-700' };
    return { name: 'Mindful Cadet 🌱', color: 'bg-green-100 text-green-700' };
  };

  const badge = getBadge(level);

  return (
    <div className={`relative min-h-screen transition-all duration-700 ${fullscreenMode ? 'bg-gray-900/95 z-50 text-white' : ''}`}>
      {/* Background Blobs (Hidden in Fullscreen) */}
      {!fullscreenMode && (
        <>
          <div className="absolute top-10 left-10 w-96 h-96 bg-pastel-pink rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-pastel-blue rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>
        </>
      )}

      {/* Header Panel */}
      <AnimatePresence>
        {!fullscreenMode && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
          >
            <div>
              <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
                Deep Focus Mode <span className="animate-pulse">🎧</span>
              </h1>
              <p className="text-gray-500 mt-1">Stay present, stay productive, one session at a time.</p>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <div className="px-4 py-2 glass rounded-2xl flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white/50">
                <Clock className="text-pastel-darkPink" size={18} />
                <span>Today's Sessions: {completedToday}</span>
              </div>
              <div className="px-4 py-2 glass rounded-2xl flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white/50">
                <Flame className="text-orange-500" size={18} />
                <span>Streak: {streak} days</span>
              </div>
              <div className="px-4 py-2 glass rounded-2xl flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white/50">
                <Calendar className="text-pastel-darkPink" size={18} />
                <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Core Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative z-10">
        
        {/* Central Circular Animated Timer & Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`glass-card p-8 text-center flex flex-col items-center justify-center relative overflow-hidden transition-all ${
            fullscreenMode ? 'bg-transparent border-none' : ''
          }`}>
            
            {/* Mode selection buttons */}
            <div className="flex justify-center gap-3 mb-8 relative z-10 bg-white/30 backdrop-blur-md p-1.5 rounded-2xl border border-white/40">
              {['Focus', 'Short Break', 'Long Break'].map(m => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setIsRunning(false);
                  }}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                    mode === m 
                      ? 'bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Circular Timer Ring */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-8">
              {/* Pulsing glow background */}
              <div className={`absolute inset-0 rounded-full bg-pastel-pink/10 filter blur-xl transition-all duration-1000 ${
                isRunning ? 'scale-110 opacity-70 animate-pulse' : 'scale-95 opacity-35'
              }`} />

              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className={`${fullscreenMode ? 'stroke-gray-800' : 'stroke-white/50'}`}
                  strokeWidth="3.5"
                  fill="none"
                />
                {/* Colored Progress Ring */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-pastel-darkPink"
                  strokeWidth="4"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * progressPercentage) / 100}
                  strokeLinecap="round"
                  fill="none"
                  transition={{ ease: "easeInOut" }}
                />
              </svg>

              {/* Inside clock labels */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-sm font-extrabold tracking-widest text-gray-400 block uppercase mb-1">
                  {mode}
                </span>
                <span className={`text-5xl md:text-6xl font-black tabular-nums tracking-tighter ${
                  fullscreenMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs font-semibold text-gray-500 mt-2 block animate-pulse">
                  {isRunning ? 'Stay present 🍃' : 'Paused'}
                </span>
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex gap-4 items-center justify-center relative z-10">
              <button 
                onClick={handleReset}
                className="p-3.5 glass hover:bg-white rounded-2xl shadow-sm border border-white/20 transition-all text-gray-600 hover:text-gray-800"
                title="Reset session"
              >
                <RotateCcw size={20} />
              </button>

              <button 
                onClick={handleStartPause}
                className="px-8 py-3.5 bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-lg flex items-center gap-2"
              >
                {isRunning ? <Pause size={20} /> : <Play size={20} />}
                {isRunning ? 'Pause' : 'Start Focus'}
              </button>

              <button 
                onClick={handleSkip}
                className="p-3.5 glass hover:bg-white rounded-2xl shadow-sm border border-white/20 transition-all text-gray-600 hover:text-gray-800"
                title="Skip Session"
              >
                <SkipForward size={20} />
              </button>

              <button 
                onClick={() => setFullscreenMode(!fullscreenMode)}
                className="p-3.5 glass hover:bg-white rounded-2xl shadow-sm border border-white/20 transition-all text-gray-600 hover:text-gray-800"
                title="Fullscreen focus mode"
              >
                {fullscreenMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            </div>

          </div>

          {/* Connected task integration section */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-gray-800 border-b border-white/30 pb-3 flex items-center gap-2">
              <CheckSquare className="text-pastel-darkPink" size={18} /> Connect a Task
            </h3>
            <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Active Task</label>
                <select 
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full bg-white/60 border border-white/40 focus:border-pastel-darkPink rounded-xl py-3 px-3 text-gray-700 outline-none cursor-pointer text-sm font-semibold"
                >
                  <option value="">No Active Task Connected</option>
                  {tasks.map(t => (
                    <option key={t._id} value={t._id}>{t.title} ({t.priority})</option>
                  ))}
                </select>
              </div>
              {selectedTaskId && (
                <div className="bg-pastel-pink/40 border border-pastel-pink/60 px-4 py-2 rounded-xl text-center sm:text-left">
                  <span className="text-xs font-bold text-pastel-darkPink block uppercase">Reward</span>
                  <span className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5 justify-center sm:justify-start">
                    <Sparkles size={14} /> Completed after focus session!
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side panel: Ambient Sound widget & Gamified stats */}
        <div className="space-y-6">
          
          {/* Gamified XP and Level stats dashboard card */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b border-white/30 pb-3 flex items-center gap-2">
              <Sparkles className="text-pastel-darkPink" size={18} /> Focus Level & Badges
            </h3>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-pastel-darkPink to-pastel-darkLavender text-white font-extrabold rounded-2xl flex items-center justify-center text-2xl shadow-md">
                {level}
              </div>
              <div>
                <span className="text-sm font-extrabold text-gray-800 block">{badge.name}</span>
                <span className="text-xs text-gray-500">Earn XP by finishing focus sessions</span>
              </div>
            </div>

            {/* XP progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                <span>XP PROGRESS</span>
                <span>{xp % 500} / 500 XP</span>
              </div>
              <div className="h-2.5 w-full bg-white/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender transition-all duration-500" 
                  style={{ width: `${((xp % 500) / 500) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Calming Focus Ambient Sounds synthesiser card */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/30 pb-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Music className="text-pastel-darkPink" size={18} /> Calming Ambient Audio
              </h3>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 hover:bg-white/40 rounded-lg text-gray-500"
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Lofi', icon: '🍵' },
                { name: 'Rain', icon: '🌧️' },
                { name: 'Nature', icon: '🍃' },
                { name: 'Piano', icon: '🎹' }
              ].map(ambient => {
                const isActive = activeAmbient === ambient.name && isMusicPlaying;
                return (
                  <button
                    key={ambient.name}
                    onClick={() => handleToggleAmbient(ambient.name)}
                    className={`py-3 px-4 rounded-xl border-2 transition-all flex items-center gap-2 justify-center ${
                      isActive 
                        ? 'bg-pastel-pink/50 border-pastel-darkPink text-pastel-darkPink font-bold scale-105' 
                        : 'bg-white/60 border-white text-gray-600 hover:bg-white'
                    }`}
                  >
                    <span>{ambient.icon}</span>
                    <span>{ambient.name}</span>
                  </button>
                );
              })}
            </div>
            
            {isMusicPlaying && (
              <div className="flex items-center gap-1 justify-center pt-2">
                {/* Moving Audio Equalizer Animation */}
                {[...Array(6)].map((_, i) => (
                  <motion.div 
                    key={i}
                    className="w-1 bg-pastel-darkPink rounded-full"
                    animate={{ height: [8, 20, 8] }}
                    transition={{ repeat: Infinity, duration: 0.6 + i * 0.1, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats Panel */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b border-white/30 pb-3 flex items-center gap-2">
              <BarChart2 className="text-pastel-darkPink" size={18} /> Focus Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/40 p-4 rounded-2xl border border-white/50 text-center">
                <span className="text-xs font-bold text-gray-400 block uppercase">Focus Hours</span>
                <span className="text-2xl font-extrabold text-gray-800">{totalFocusHrs}h</span>
              </div>
              <div className="bg-white/40 p-4 rounded-2xl border border-white/50 text-center">
                <span className="text-xs font-bold text-gray-400 block uppercase">Sessions</span>
                <span className="text-2xl font-extrabold text-gray-800">{sessions.length}</span>
              </div>
            </div>
          </div>

          {/* Custom Settings Config */}
          <div className="glass-card p-6 space-y-4">
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="w-full py-2.5 bg-white/60 border border-white/40 hover:bg-white text-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Settings2 size={16} /> Customize Timer Durations
            </button>

            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 pt-3 overflow-hidden"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-600">
                      <span>Focus Duration</span>
                      <span>{focusDur} min</span>
                    </div>
                    <input 
                      type="range" min="5" max="60" step="5"
                      value={focusDur}
                      onChange={(e) => setFocusDur(parseInt(e.target.value))}
                      className="w-full accent-pastel-darkPink"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-600">
                      <span>Short Break</span>
                      <span>{shortBreakDur} min</span>
                    </div>
                    <input 
                      type="range" min="1" max="25" step="1"
                      value={shortBreakDur}
                      onChange={(e) => setShortBreakDur(parseInt(e.target.value))}
                      className="w-full accent-pastel-darkPink"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="autoStart"
                      checked={autoStartBreaks}
                      onChange={(e) => setAutoStartBreaks(e.target.checked)}
                      className="rounded border-gray-300 text-pastel-darkPink focus:ring-pastel-darkPink"
                    />
                    <label htmlFor="autoStart" className="text-xs text-gray-600 font-bold uppercase cursor-pointer">Auto start break sessions</label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dynamic rotating Quotes */}
          <div className="glass-card p-6 bg-gradient-to-tr from-pastel-pink/20 to-pastel-lavender/20 border-none text-center">
            <h4 className="text-xs font-bold text-pastel-darkPink uppercase tracking-wider mb-1.5">Vibe Check</h4>
            <p className="text-sm font-semibold text-gray-700 italic">"{quote}"</p>
          </div>

        </div>
      </div>

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

export default FocusTimer;
