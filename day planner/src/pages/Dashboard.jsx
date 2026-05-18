import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Clock, Heart, Award, Plus } from 'lucide-react';

const Dashboard = () => {
  const { user } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const tasksRes = await axios.get('http://localhost:5000/api/tasks', { headers });
        setTasks(tasksRes.data.slice(0, 5)); // Get top 5 tasks
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center"><CheckCircle /></div>
          <div>
            <p className="text-gray-500 text-sm">Tasks Left</p>
            <p className="text-2xl font-bold text-gray-800">{tasks.filter(t => !t.completed).length}</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-500 flex items-center justify-center"><Heart /></div>
          <div>
            <p className="text-gray-500 text-sm">Daily Vibe</p>
            <p className="text-xl font-bold text-gray-800">Mindful ✨</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center"><Award /></div>
          <div>
            <p className="text-gray-500 text-sm">Active Streaks</p>
            <p className="text-2xl font-bold text-gray-800">3</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-500 flex items-center justify-center"><Clock /></div>
          <div>
            <p className="text-gray-500 text-sm">Focus Time</p>
            <p className="text-2xl font-bold text-gray-800">2.5h</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Widget */}
        <motion.div variants={itemVariants} className="glass-card p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Today's Tasks</h2>
            <button className="text-pastel-darkPink hover:bg-pastel-pink/50 p-2 rounded-xl transition-colors">
              <Plus size={20} />
            </button>
          </div>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/50 rounded-xl"></div>)}
            </div>
          ) : tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task._id} className="bg-white/40 p-4 rounded-xl flex items-center justify-between group hover:bg-white/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <button className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.completed ? 'bg-green-400 border-green-400 text-white' : 'border-gray-300'}`}>
                      {task.completed && <CheckCircle size={16} />}
                    </button>
                    <span className={`font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{task.title}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${task.priority === 'High' ? 'bg-red-100 text-red-600' : task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3"><CheckCircle size={32} /></div>
              <p className="text-gray-500">All caught up! Time to relax ✨</p>
            </div>
          )}
        </motion.div>

        {/* Quick Actions / Quote */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="glass-card p-6 bg-gradient-to-br from-pastel-darkPink/10 to-pastel-darkLavender/10 border-none">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Quote of the Day</h3>
            <p className="text-gray-600 italic">"The secret of getting ahead is getting started."</p>
            <p className="text-sm text-gray-400 mt-2">— Mark Twain</p>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Focus Timer</h3>
            <div className="w-32 h-32 mx-auto border-4 border-pastel-darkPink rounded-full flex items-center justify-center relative shadow-[0_0_15px_rgba(244,114,182,0.5)]">
              <span className="text-3xl font-bold text-gray-800">25:00</span>
            </div>
            <div className="flex justify-center mt-6">
              <button className="bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all">Start Focus</button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
