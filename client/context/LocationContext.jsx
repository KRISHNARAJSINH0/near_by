'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export const PRESET_LOCATIONS = [
  { name: 'Mumbai Center (default)', latitude: 19.0760, longitude: 72.8777 },
  { name: 'Bandra West (Mumbai)', latitude: 19.0596, longitude: 72.8295 },
  { name: 'Powai IIT (Mumbai)', latitude: 19.1254, longitude: 72.9114 },
  { name: 'San Francisco (SOMA)', latitude: 37.7749, longitude: -122.4194 },
  { name: 'New York (Manhattan)', latitude: 40.7128, longitude: -74.0060 },
  { name: 'Bangalore (Indiranagar)', latitude: 12.9716, longitude: 77.5946 }
];

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState({
    latitude: 19.0760, // Mumbai default
    longitude: 72.8777
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMockLocation, setIsMockLocation] = useState(false);
  const [activePresetName, setActivePresetName] = useState('Mumbai Center (default)');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // If user has not enabled mock location, use real location
        if (!isMockLocation) {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setActivePresetName('Your Real Device GPS');
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Geolocation access denied. Falling back to Mumbai coordinates.');
        setError(err.message);
        // Stick to Mumbai default
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [isMockLocation]);

  const setManualCoordinates = (lat, lng, name = 'Simulated Location') => {
    setLocation({
      latitude: parseFloat(lat),
      longitude: parseFloat(lng)
    });
    setIsMockLocation(true);
    setActivePresetName(name);
  };

  const toggleMockMode = (active) => {
    setIsMockLocation(active);
    if (!active) {
      // Re-trigger standard fetch
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setActivePresetName('Your Real Device GPS');
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );
    }
  };

  return (
    <LocationContext.Provider value={{
      location,
      loading,
      error,
      isMockLocation,
      activePresetName,
      setManualCoordinates,
      toggleMockMode,
      presetLocations: PRESET_LOCATIONS
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
