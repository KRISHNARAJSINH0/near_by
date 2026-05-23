'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useLocation } from './LocationContext';

const SocketContext = createContext();

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { location } = useLocation();
  const [socket, setSocket] = useState(null);
  const [nearbyAlerts, setNearbyAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Initialize socket connection
    const socketInstance = io(SOCKET_URL);

    socketInstance.on('connect', () => {
      console.log('Socket connected successfully:', socketInstance.id);
      
      // Register user with their active coordinates
      socketInstance.emit('register_user', {
        uid: user.uid,
        name: user.name,
        latitude: location.latitude,
        longitude: location.longitude
      });
    });

    // Listen for nearby team alerts
    socketInstance.on('nearby_poll_alert', (alert) => {
      console.log('Received nearby team alert:', alert);
      setNearbyAlerts((prev) => [
        { id: Math.random().toString(), ...alert, read: false },
        ...prev
      ]);
    });

    // Listen for global user statuses (online/offline)
    socketInstance.on('user_status_change', (status) => {
      console.log('Status change received:', status);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user]);

  // Keep coordinates updated in the Socket server when location changes
  useEffect(() => {
    if (socket && socket.connected && location) {
      socket.emit('update_location', {
        latitude: location.latitude,
        longitude: location.longitude
      });
    }
  }, [location, socket]);

  const clearAlert = (id) => {
    setNearbyAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <SocketContext.Provider value={{
      socket,
      nearbyAlerts,
      clearAlert,
      notifications,
      setNotifications
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
