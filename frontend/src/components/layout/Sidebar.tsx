import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Map,
    LogOut,
    MapPin,
    History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const Sidebar: React.FC = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { icon: Map, label: 'Site Selection', path: '/dashboard/site-selection' },
        { icon: History, label: 'History', path: '/dashboard/history' },
    ];

    return (
        <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
            <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">GeoSelect AI</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200',
                                isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            )
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                    <div
                        className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate('/dashboard/profile')}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">{user?.username}</span>
                            <span className="text-xs text-slate-400">{user?.role}</span>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 hover:bg-slate-700 rounded-md text-slate-400 hover:text-red-400 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
