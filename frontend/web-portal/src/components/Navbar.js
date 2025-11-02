import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Waves, Shield, Fish, LogOut } from 'lucide-react';
import { useAuth } from '../services/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-shark-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="relative">
              <Waves className="h-8 w-8" />
              <Fish className="h-4 w-4 absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5" />
            </div>
            <span className="text-2xl font-extrabold tracking-wide" style={{ fontFamily: "'Poppins', 'Inter', sans-serif", letterSpacing: '0.05em' }}>
              Surfers<span className="text-shark-200">.</span>
            </span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link to="/" className="hover:text-shark-200 transition-colors">
              Dashboard
            </Link>
            <Link to="/map" className="hover:text-shark-200 transition-colors">
              Geo Fence
            </Link>
            <Link to="/shark-detection" className="hover:text-shark-200 transition-colors">
              Detection
            </Link>
            <Link to="/subscribers" className="hover:text-shark-200 transition-colors">
              Subscribers
            </Link>
            <Link to="/drones" className="hover:text-shark-200 transition-colors">
              Drones
            </Link>
            <Link to="/alerts" className="hover:text-shark-200 transition-colors">
              Alerts
            </Link>
            
            <div className="flex items-center space-x-4 border-l border-shark-500 pl-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm">{user?.name || 'Admin'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 hover:text-shark-200 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
