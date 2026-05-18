import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, Heart, Book, Bell, Award } from 'lucide-react';

const LandingPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, staggerChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-gradient-pastel overflow-hidden font-sans">
      {/* Navigation */}
      <nav className="glass m-4 px-6 py-4 flex justify-between items-center rounded-2xl relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pastel-darkPink to-pastel-darkLavender flex items-center justify-center text-white font-bold text-xl">M</div>
          <span className="text-xl font-bold text-gray-800">MoodMint</span>
        </div>
        <div className="hidden md:flex gap-6 text-gray-600 font-medium">
          <a href="#features" className="hover:text-pastel-darkPink transition-colors">Features</a>
          <a href="#about" className="hover:text-pastel-darkPink transition-colors">About</a>
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="px-5 py-2 rounded-xl font-medium text-gray-700 hover:bg-white/50 transition-colors">Login</Link>
          <Link to="/signup" className="px-5 py-2 rounded-xl font-medium text-white bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.main 
        className="container mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="inline-block mb-4 px-4 py-1.5 rounded-full glass border-white/50 text-pastel-darkPink font-medium text-sm">
          ✨ Your daily dose of productivity & peace
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold text-gray-800 mb-6 tracking-tight max-w-4xl">
          Plan Your Day, <br/>
          <span className="text-gradient">Protect Your Peace</span>
        </motion.h1>
        
        <motion.p variants={itemVariants} className="text-xl text-gray-600 mb-10 max-w-2xl">
          The aesthetic productivity dashboard designed for GenZ. Track your moods, build habits, and conquer tasks in a beautiful pastel workspace.
        </motion.p>
        
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
          <Link to="/signup" className="px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender shadow-xl shadow-pastel-darkPink/20 hover:shadow-2xl hover:shadow-pastel-darkPink/40 transition-all hover:-translate-y-1 text-lg">
            Get Started
          </Link>
          <a href="#features" className="px-8 py-4 rounded-2xl font-bold text-gray-700 glass-card hover:-translate-y-1 text-lg transition-all">
            Explore Features
          </a>
        </motion.div>
      </motion.main>

      {/* Features Section */}
      <section id="features" className="py-24 relative z-10 bg-white/20 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600">All your productivity tools in one aesthetic place.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: CheckCircle, title: 'Daily Planner', desc: 'Organize tasks with priority tags.', color: 'text-pink-500', bg: 'bg-pink-100' },
              { icon: Heart, title: 'Mood Tracker', desc: 'Track daily vibes & emotions.', color: 'text-red-500', bg: 'bg-red-100' },
              { icon: Award, title: 'Habit Tracker', desc: 'Build streaks & stay consistent.', color: 'text-yellow-500', bg: 'bg-yellow-100' },
              { icon: Clock, title: 'Focus Timer', desc: 'Pomodoro timer for deep work.', color: 'text-blue-500', bg: 'bg-blue-100' },
              { icon: Book, title: 'Notes', desc: 'Pastel sticky notes for thoughts.', color: 'text-purple-500', bg: 'bg-purple-100' },
              { icon: Bell, title: 'Reminders', desc: 'Never miss an important event.', color: 'text-orange-500', bg: 'bg-orange-100' },
              { icon: Calendar, title: 'Calendar', desc: 'Visualize your upcoming week.', color: 'text-green-500', bg: 'bg-green-100' },
            ].map((feat, i) => (
              <motion.div 
                key={i} 
                className="glass-card p-6"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={`w-12 h-12 rounded-xl ${feat.bg} ${feat.color} flex items-center justify-center mb-4`}>
                  <feat.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{feat.title}</h3>
                <p className="text-gray-600">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Blobs Background */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-pastel-darkPink rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-pastel-darkLavender rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pastel-blue rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
    </div>
  );
};

export default LandingPage;
