import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import { User, Mail, Shield } from 'lucide-react';

const ProfileView: React.FC = () => {
    const { user: authUser } = useAuth();
    const [profile, setProfile] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/profile');
                setProfile(response.data);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const user = profile || authUser;

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-semibold text-slate-900">User Profile</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage your account information.</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white">
                            {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{user.username}</h3>
                            <p className="text-slate-500 capitalize">{user.role}</p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-3 mb-2">
                                <User className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium text-slate-700">Username</span>
                            </div>
                            <p className="text-slate-900 font-medium ml-7">{user.username}</p>
                        </div>

                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-3 mb-2">
                                <Mail className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium text-slate-700">Email</span>
                            </div>
                            <p className="text-slate-900 font-medium ml-7">{user.email || 'Not provided'}</p>
                        </div>

                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-3 mb-2">
                                <Shield className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium text-slate-700">Role</span>
                            </div>
                            <p className="text-slate-900 font-medium ml-7 capitalize">{user.role}</p>
                        </div>

                        {/* We can add 'Member Since' if we update AuthContext to include created_at */}
                        {/* For now, we'll omit it or use a placeholder if needed, but better to stick to what we have */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
