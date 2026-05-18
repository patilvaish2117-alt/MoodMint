import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Calendar, Heart, Award, Clock, Book, LogOut, Settings, Menu, X } from 'lucide-react';

const Layout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser || !localStorage.getItem('token')) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/app', icon: Home },
    { name: 'Planner', path: '/app/planner', icon: Calendar },
    { name: 'Habits', path: '/app/habits', icon: Award },
    { name: 'Notes', path: '/app/notes', icon: Book },
    { name: 'Focus Timer', path: '/app/timer', icon: Clock },
  ];

  if (!user) return null;

  return (
    <div className="flex h-screen bg-pastel-gray overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside 
        className={`fixed lg:static inset-y-0 left-0 w-64 glass m-4 mr-0 rounded-2xl z-50 flex flex-col transform transition-transform duration-300 lg:transform-none ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pastel-darkPink to-pastel-darkLavender flex items-center justify-center text-white font-bold text-xl">M</div>
            <span className="text-xl font-bold text-gray-800">MoodMint</span>
          </div>
          <button className="lg:hidden text-gray-500" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="px-4 py-2 border-b border-white/20 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pastel-pink flex items-center justify-center text-pastel-darkPink font-bold text-lg">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{user.username}</p>
            <p className="text-xs text-gray-500">Free Plan</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-gradient-to-r from-pastel-darkPink/20 to-pastel-darkLavender/20 text-pastel-darkLavender font-semibold' : 'text-gray-600 hover:bg-white/50'}`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon size={20} className={isActive ? 'text-pastel-darkPink' : ''} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/20 space-y-2">
          <Link to="/app/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-white/50 transition-colors">
            <Settings size={20} /> Settings
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Topbar */}
        <header className="h-20 flex items-center justify-between px-8 z-10">
          <button className="lg:hidden text-gray-500 p-2 glass rounded-xl" onClick={() => setIsOpen(true)}>
            <Menu size={24} />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-gray-800">Hello, {user.username} ✨</h1>
            <p className="text-gray-500 text-sm">Let's make today a great day!</p>
          </div>
          
          <div className="glass px-4 py-2 rounded-xl text-sm font-medium text-gray-600 flex items-center gap-2">
            <Calendar size={16} className="text-pastel-darkPink" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 z-10">
          <Outlet context={{ user }} />
        </div>
        
        {/* Decorative Background */}
        <div className="fixed top-20 right-10 w-96 h-96 bg-pastel-pink rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>
      </main>
    </div>
  );
};

export default Layout;
