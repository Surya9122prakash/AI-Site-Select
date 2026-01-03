import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthResponse } from '../types/auth';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (formData: FormData) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                // Check if token is expired
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser({
                        username: decoded.username || decoded.sub,
                        role: decoded.role,
                        email: decoded.email
                    });
                }
            } catch (e) {
                logout();
            }
        }
        setIsLoading(false);
    }, [token]);

    const login = async (formData: FormData) => {
        const response = await api.post<AuthResponse>('/login', formData);
        const { access_token } = response.data;

        localStorage.setItem('token', access_token);
        setToken(access_token);

        const decoded: any = jwtDecode(access_token);
        console.log('Decoded Token:', decoded);
        setUser({
            username: decoded.username || decoded.sub,
            role: decoded.role,
            email: decoded.email
        });
    };

    const register = async (data: any) => {
        await api.post('/register', data);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
