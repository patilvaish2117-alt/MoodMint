import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import axios from 'axios';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-pastel flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass p-8 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-pastel-darkPink to-pastel-darkLavender flex items-center justify-center text-white font-bold text-2xl mb-4">M</div>
          <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-500 mt-2">Join MoodMint today ✨</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type="text" name="username" placeholder="Username" required
              className="w-full bg-white/50 border border-white/40 focus:border-pastel-darkPink focus:ring-2 focus:ring-pastel-darkPink/20 rounded-xl py-3 pl-10 pr-4 text-gray-700 outline-none transition-all placeholder-gray-400"
              onChange={handleChange}
            />
          </div>
          
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type="email" name="email" placeholder="Email" required
              className="w-full bg-white/50 border border-white/40 focus:border-pastel-darkPink focus:ring-2 focus:ring-pastel-darkPink/20 rounded-xl py-3 pl-10 pr-4 text-gray-700 outline-none transition-all placeholder-gray-400"
              onChange={handleChange}
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" required
              className="w-full bg-white/50 border border-white/40 focus:border-pastel-darkPink focus:ring-2 focus:ring-pastel-darkPink/20 rounded-xl py-3 pl-10 pr-10 text-gray-700 outline-none transition-all placeholder-gray-400"
              onChange={handleChange}
            />
            <button type="button" className="absolute right-3 top-3 text-gray-400" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type={showPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm Password" required
              className="w-full bg-white/50 border border-white/40 focus:border-pastel-darkPink focus:ring-2 focus:ring-pastel-darkPink/20 rounded-xl py-3 pl-10 pr-4 text-gray-700 outline-none transition-all placeholder-gray-400"
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-pastel-darkPink to-pastel-darkLavender text-white font-bold rounded-xl py-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all mt-4">
            Sign Up
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Already have an account? <Link to="/login" className="text-pastel-darkPink font-semibold hover:underline">Log in</Link>
        </p>
      </motion.div>
      
      {/* Background Blobs */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-pastel-darkPink rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="fixed bottom-20 right-10 w-72 h-72 bg-pastel-blue rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
    </div>
  );
};

export default Signup;
