import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { register: registerAuth, login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        setError('');
        try {
            if (isLogin) {
                const formData = new FormData();
                formData.append('username', data.username);
                formData.append('password', data.password);
                await login(formData);
                navigate('/dashboard/site-selection');
            } else {
                await registerAuth({
                    username: data.username,
                    password: data.password,
                    email: data.email,
                    role: data.role
                });
                // Auto login after register
                const formData = new FormData();
                formData.append('username', data.username);
                formData.append('password', data.password);
                await login(formData);
                navigate('/dashboard/site-selection');
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            if (err.code === "ERR_NETWORK") {
                setError('Unable to connect to server. Is the backend running?');
            } else if (err.response?.status === 400 || err.response?.status === 401) {
                setError(err.response?.data?.detail || 'Invalid credentials');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Image/Branding */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 z-10" />
                <div className="relative z-20 text-white p-12 max-w-lg">
                    <div className="mb-8 p-4 bg-white/10 backdrop-blur-md rounded-2xl w-16 h-16 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        AI-Powered Site Selection
                    </h1>
                    <p className="text-slate-300 text-lg leading-relaxed">
                        Leverage advanced geographical data and machine learning to identify the optimal locations for your development projects.
                    </p>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-3xl" />
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900">{isLogin ? 'Welcome back' : 'Create an account'}</h2>
                        <p className="mt-2 text-slate-600">{isLogin ? 'Please enter your details to sign in.' : 'Sign up to get started.'}</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                <input
                                    {...register('username', { required: 'Username is required' })}
                                    type="text"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    placeholder="Enter your username"
                                />
                                {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username.message as string}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input
                                    {...register('password', { required: 'Password is required' })}
                                    type="password"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message as string}</p>}
                            </div>

                            {!isLogin && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                        <input
                                            {...register('email', { required: 'Email is required' })}
                                            type="email"
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                            placeholder="you@example.com"
                                        />
                                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message as string}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                        <select
                                            {...register('role', { required: 'Role is required' })}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        >
                                            <option value="Planner">Planner</option>
                                            <option value="Government">Government</option>
                                            <option value="Developer">Developer</option>
                                        </select>
                                        {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role.message as string}</p>}
                                    </div>
                                </>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                isLogin ? 'Sign in' : 'Create account'
                            )}
                        </button>

                        <div className="text-center mt-6">
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
