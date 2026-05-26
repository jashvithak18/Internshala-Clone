import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const { i18n } = useTranslation();
  
  // centralize the backend API URL (supports environment override)
  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Auth state
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Community Feed State
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Socket state
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // Sandbox Simulator state (Helps test advanced rules easily)
  const [simulatedDevice, setSimulatedDevice] = useState('desktop'); // desktop, laptop, mobile
  const [simulatedBrowser, setSimulatedBrowser] = useState('Chrome'); // Chrome, Firefox, Safari
  const [simulatedIp, setSimulatedIp] = useState('127.0.0.1');
  const [developerPanelOpen, setDeveloperPanelOpen] = useState(true); // default open to guide user

  // Live IST Time Tracking
  const [istTime, setIstTime] = useState({ hours: 0, minutes: 0, seconds: 0, formatted: '' });

  // Load user from localStorage token
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await axios.get(`${BACKEND_URL}/api/auth/profile`, {
            headers: {
              'x-device-type': simulatedDevice,
              'x-browser-override': simulatedBrowser,
              'x-ip-override': simulatedIp,
            }
          });
          setUser(res.data);
          setIsAuthenticated(true);
          // Apply stored language preference
          if (res.data.language) {
            i18n.changeLanguage(res.data.language);
          }
        } catch (error) {
          console.error('Session loading failed:', error.response?.data?.message || error.message);
          // If mobile blocked, don't clear token immediately, just bubble up the block reason
          if (error.response?.data?.errorType !== 'MOBILE_TIME_BLOCK') {
            logout();
          }
        }
      }
      setAuthLoading(false);
    };

    loadUser();
  }, [token]);

  // Handle active IST clock updates (UTC + 5:30)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istDate = new Date(utc + (330 * 60000));
      
      setIstTime({
        hours: istDate.getHours(),
        minutes: istDate.getMinutes(),
        seconds: istDate.getSeconds(),
        formatted: istDate.toLocaleTimeString('en-US', { hour12: true })
      });
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Configure Socket.IO
  useEffect(() => {
    if (user && token) {
      const socketClient = io(BACKEND_URL);
      setSocket(socketClient);

      // Join User's unique room for private events
      socketClient.emit('join_user_room', user._id);

      // Fetch initial notifications
      fetchNotifications();

      // Listen for socket events
      socketClient.on('new_notification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      });

      socketClient.on('new_friend_request', (request) => {
        setPendingRequests((prev) => [request, ...prev]);
      });

      socketClient.on('friend_request_accepted', ({ friend }) => {
        setFriends((prev) => [...prev, friend]);
        // Refresh profile info to update postsCountToday and friends list size
        refreshProfile();
      });

      socketClient.on('new_post', (post) => {
        setPosts((prev) => [post, ...prev]);
      });

      socketClient.on('post_liked', ({ postId, likes, userId, action }) => {
        setPosts((prev) =>
          prev.map((post) => (post._id === postId ? { ...post, likes } : post))
        );
      });

      socketClient.on('new_comment', ({ postId, comment }) => {
        // Increment commentsCount in UI feed
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId ? { ...post, commentsCount: post.commentsCount + 1 } : post
          )
        );
      });

      return () => {
        socketClient.disconnect();
      };
    }
  }, [user]);

  // Auth Operations
  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    setToken(userData.token);
    setUser(userData);
    setIsAuthenticated(true);
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setNotifications([]);
    setFriends([]);
    setPendingRequests([]);
    if (socket) socket.disconnect();
  };

  const refreshProfile = async () => {
    if (token) {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/auth/profile`, {
          headers: {
            'x-device-type': simulatedDevice,
            'x-browser-override': simulatedBrowser,
            'x-ip-override': simulatedIp,
          }
        });
        setUser(res.data);
      } catch (err) {
        console.error('Refresh profile error:', err.message);
      }
    }
  };

  // Notification Operations
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/notifications`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Fetch notifications error:', err.message);
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await axios.put(`${BACKEND_URL}/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err.message);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await axios.put(`${BACKEND_URL}/api/notifications/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err.message);
    }
  };

  // Base Axios configured call with full simulator overrides injected
  const apiCall = async (method, url, data = {}, extraHeaders = {}) => {
    const config = {
      method,
      url: `${BACKEND_URL}${url}`,
      data,
      headers: {
        'x-device-type': simulatedDevice,
        'x-browser-override': simulatedBrowser,
        'x-ip-override': simulatedIp,
        ...extraHeaders
      }
    };
    return axios(config);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        token,
        isAuthenticated,
        authLoading,
        login,
        logout,
        refreshProfile,
        apiCall,
        posts,
        setPosts,
        friends,
        setFriends,
        pendingRequests,
        setPendingRequests,
        notifications,
        setNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        istTime,
        
        // Sandbox features
        simulatedDevice,
        setSimulatedDevice,
        simulatedBrowser,
        setSimulatedBrowser,
        simulatedIp,
        setSimulatedIp,
        developerPanelOpen,
        setDeveloperPanelOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
