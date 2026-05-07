import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const inactivityTimeoutRef = React.useRef(null);
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

    // Setup axios interceptor to include token in all requests
    useEffect(() => {
        const interceptor = axios.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(interceptor);
        };
    }, []);

    // Verify token on app load
    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await axios.get(`${API_URL}/api/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(res.data);
                    setIsAuthenticated(true);

                    // Link this browser's push subscription to the user
                    if (window.OneSignalDeferred) {
                        window.OneSignalDeferred.push(async function (OneSignal) {
                            try {
                                await OneSignal.login(String(res.data.id));
                                // Tag admin users for targeted admin notifications
                                if (res.data.role === 'admin') {
                                    await OneSignal.User.addTag('role', 'admin');
                                }
                            } catch (e) {
                                console.log('OneSignal login failed:', e);
                            }
                        });
                    }
                } catch (err) {
                    console.error('Token verification failed:', err);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };

        verifyToken();
    }, []);

    // Reset inactivity timeout
    const resetInactivityTimeout = React.useCallback(() => {
        if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current);
        }

        if (isAuthenticated) {
            inactivityTimeoutRef.current = setTimeout(() => {
                console.log('User inactive for 15 minutes, logging out...');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                setIsAuthenticated(false);
            }, INACTIVITY_TIMEOUT);
        }
    }, [isAuthenticated]);

    // Set up activity event listeners
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        const handleActivity = () => {
            resetInactivityTimeout();
        };

        // Add event listeners
        activityEvents.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Initialize timeout on mount
        resetInactivityTimeout();

        // Cleanup
        return () => {
            activityEvents.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
            }
        };
    }, [isAuthenticated, resetInactivityTimeout]);

    const register = async (email, password, fullName, phone) => {
        try {
            const res = await axios.post(`${API_URL}/api/auth/register`, {
                email,
                password,
                fullName,
                phone
            });

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setUser(res.data.user);
            setIsAuthenticated(true);

            return { success: true };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Registration failed'
            };
        }
    };

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, {
                email,
                password
            });

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setUser(res.data.user);
            setIsAuthenticated(true);

            // Link this browser's push subscription to the user
            if (window.OneSignalDeferred) {
                window.OneSignalDeferred.push(async function (OneSignal) {
                    try {
                        await OneSignal.login(String(res.data.user.id));
                    } catch (e) {
                        console.log('OneSignal login failed:', e);
                    }
                });
            }

            return { success: true };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Login failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);

        // Unlink push subscription from the user
        if (window.OneSignalDeferred) {
            window.OneSignalDeferred.push(async function (OneSignal) {
                try {
                    await OneSignal.logout();
                } catch (e) {
                    console.log('OneSignal logout failed:', e);
                }
            });
        }
    };

    const updateProfile = async (fullName, email, phone) => {
        try {
            const res = await axios.put(`${API_URL}/api/auth/profile`, {
                fullName,
                email,
                phone
            });

            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            return { success: true, message: res.data.message };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Profile update failed'
            };
        }
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        register,
        login,
        logout,
        updateProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
