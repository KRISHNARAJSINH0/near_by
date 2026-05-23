'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useSocket } from '@/context/SocketContext';
import { MapPin, Bell, LogOut, User, Plus, Check, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { location, isMockLocation, activePresetName, presetLocations, setManualCoordinates, toggleMockMode } = useLocation();
  const { nearbyAlerts, clearAlert } = useSocket();
  const router = useRouter();
  const pathname = usePathname();

  const [locDropdown, setLocDropdown] = useState(false);
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [dbNotifications, setDbNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch db notifications on load and keep updated
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications`);
      setDbNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (err) {
      console.warn('Could not load notifications', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/read/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/8 bg-zinc-950/60 backdrop-blur-md px-6 py-3 flex items-center justify-between">
      {/* Brand Logo */}
      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <span className="font-extrabold text-white text-lg tracking-wider">GT</span>
        </div>
        <div>
          <span className="font-black text-xl text-white tracking-tight">Geo<span className="text-violet-400">Team</span></span>
          <span className="hidden md:inline-block text-[10px] text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full ml-2 font-semibold">Realtime Proximity</span>
        </div>
      </Link>

      {/* Action Controls */}
      <div className="flex items-center gap-4">
        {/* GPS location simulated control */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setLocDropdown(!locDropdown);
                setNotifDropdown(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isMockLocation
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-zinc-900 border-white/5 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${isMockLocation ? 'text-amber-400 animate-pulse' : 'text-violet-400'}`} />
              <span className="max-w-[140px] truncate">{activePresetName}</span>
            </button>

            {locDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/8 bg-zinc-950 p-2 shadow-2xl">
                <div className="px-3 py-2 border-b border-white/5 mb-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Simulate Location</span>
                  <button 
                    onClick={() => toggleMockMode(!isMockLocation)}
                    className="text-[10px] font-semibold text-violet-400 hover:text-violet-300"
                  >
                    {isMockLocation ? 'Use Live GPS' : 'Mock Presets'}
                  </button>
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {presetLocations.map((p) => {
                    const active = activePresetName === p.name;
                    return (
                      <button
                        key={p.name}
                        onClick={() => {
                          setManualCoordinates(p.latitude, p.longitude, p.name);
                          setLocDropdown(false);
                          // Force a page refresh on map to fetch new coordinates if active
                          if (pathname === '/map') router.refresh();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-left text-xs transition-colors ${
                          active ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:bg-white/5'
                        }`}
                      >
                        <span>{p.name}</span>
                        {active && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications list */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setNotifDropdown(!notifDropdown);
                setLocDropdown(false);
              }}
              className="relative p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {(unreadCount > 0 || nearbyAlerts.length > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-fuchsia-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white animate-bounce">
                  {unreadCount + nearbyAlerts.length}
                </span>
              )}
            </button>

            {notifDropdown && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/8 bg-zinc-950 p-2 shadow-2xl z-50">
                <div className="px-3 py-2 border-b border-white/5 mb-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Updates & Notifications</span>
                  {(dbNotifications.length > 0) && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-semibold text-violet-400 hover:text-violet-300"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1 divide-y divide-white/5">
                  {/* Realtime Proximity alerts first */}
                  {nearbyAlerts.map((alert) => (
                    <div key={alert.id} className="p-3 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg text-left text-xs mb-1">
                      <div className="flex items-center gap-1.5 text-fuchsia-300 font-bold mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Nearby Project Launched!</span>
                      </div>
                      <p className="text-zinc-300 leading-normal">{alert.message}</p>
                      <div className="mt-2 flex gap-2">
                        <Link
                          href={`/team/${alert.pollId}`}
                          onClick={() => {
                            clearAlert(alert.id);
                            setNotifDropdown(false);
                          }}
                          className="px-2 py-1 bg-fuchsia-600 text-white rounded text-[10px] font-bold hover:bg-fuchsia-700"
                        >
                          View Proximity Pin
                        </Link>
                        <button
                          onClick={() => clearAlert(alert.id)}
                          className="text-zinc-500 hover:text-zinc-300 text-[10px]"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Standard server notifications */}
                  {dbNotifications.length === 0 && nearbyAlerts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">
                      No notifications yet
                    </div>
                  ) : (
                    dbNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 text-xs transition-colors rounded-lg ${
                          notif.read ? 'text-zinc-500 opacity-60' : 'bg-violet-500/5 border border-violet-500/10 text-zinc-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="leading-snug">{notif.content}</p>
                          {!notif.read && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="text-[9px] font-semibold text-violet-400 hover:text-violet-300 shrink-0"
                            >
                              Read
                            </button>
                          )}
                        </div>
                        {notif.type === 'request' && (
                          <Link
                            href={`/team/${notif.relatedId}`}
                            onClick={() => setNotifDropdown(false)}
                            className="mt-2 inline-block text-[10px] font-bold text-violet-400 hover:underline"
                          >
                            Review Request Details →
                          </Link>
                        )}
                        {notif.type === 'accept' && (
                          <Link
                            href={`/chat`}
                            onClick={() => setNotifDropdown(false)}
                            className="mt-2 inline-block text-[10px] font-bold text-emerald-400 hover:underline"
                          >
                            Open Team Chat Workspace →
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Account / Navigation actions */}
        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${user.uid}`}
              className="flex items-center gap-2 group"
            >
              <img
                src={user.profilePhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-violet-500/20 group-hover:ring-violet-500/50 transition-all"
              />
              <span className="hidden md:inline-block text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">{user.name}</span>
            </Link>

            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs font-bold text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-xs font-bold bg-violet-600 text-white px-3.5 py-2 rounded-lg hover:bg-violet-700 shadow-md hover:shadow-violet-600/10 transition-all"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
