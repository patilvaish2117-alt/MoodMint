import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, CheckCircle, Circle, Edit2 } from 'lucide-react';

const Planner = () => {
  const { user } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('Medium');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get('https://moodmint-ozqw.onrender.com/api/tasks', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      const res = await axios.post('https://moodmint-ozqw.onrender.com/api/tasks', 
        { title: newTask, priority },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      setTasks([res.data, ...tasks]);
      setNewTask('');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTask = async (id, currentStatus) => {
    try {
      const res = await axios.put(`https://moodmint-ozqw.onrender.com/api/tasks/${id}`, 
        { completed: !currentStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      setTasks(tasks.map(t => t._id === id ? res.data : t));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`https://moodmint-ozqw.onrender.com/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTasks(tasks.filter(t => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const progress = tasks.length ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
      <div className="glass p-6 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Daily Planner</h2>
          <p className="text-gray-500 mt-1">Organize your thoughts, plan your day.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-pastel-darkLavender">{progress}%</div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Completed</p>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl">
        {/* Progress Bar */}
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
          <motion.div 
            className="h-full bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <form onSubmit={addTask} className="flex gap-3 mb-8">
          <input 
            type="text" 
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..." 
            className="flex-1 bg-white/60 border border-white focus:border-pastel-darkPink outline-none px-4 py-3 rounded-xl transition-all"
          />
          <select 
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-white/60 border border-white outline-none px-4 py-3 rounded-xl text-gray-600"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <button type="submit" className="bg-pastel-darkPink text-white px-6 py-3 rounded-xl hover:bg-pink-500 transition-colors flex items-center gap-2">
            <Plus size={20} /> Add
          </button>
        </form>

        <div className="space-y-3">
          <AnimatePresence>
            {tasks.map(task => (
              <motion.div 
                key={task._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`group flex items-center justify-between p-4 rounded-xl border ${task.completed ? 'bg-white/30 border-white/20' : 'bg-white/70 border-white'} transition-all hover:shadow-md`}
              >
                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleTask(task._id, task.completed)}>
                  <button className={`text-${task.completed ? 'green-500' : 'gray-400'} hover:text-green-500 transition-colors`}>
                    {task.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                  </button>
                  <span className={`text-lg transition-all ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {task.title}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    task.priority === 'High' ? 'bg-red-100 text-red-600' : 
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 
                    'bg-green-100 text-green-600'
                  }`}>
                    {task.priority}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-500 bg-white rounded-lg shadow-sm">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteTask(task._id)} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-lg shadow-sm">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {tasks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4"><CheckCircle size={40} className="text-gray-300" /></div>
              <p className="text-lg font-medium text-gray-600">No tasks yet!</p>
              <p>Add a task to start planning your day.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Planner;
