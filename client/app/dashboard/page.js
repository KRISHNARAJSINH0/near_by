'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Compass, Users, Clock, Send, Plus, CheckCircle, Bell, Loader2, Sparkles, MapPin } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { location } = useLocation();
  const router = useRouter();

  const [nearbyCount, setNearbyCount] = useState(0);
  const [activeRooms, setActiveRooms] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch nearby polls count (using default 10km radius)
      const nearbyRes = await axios.get(`${API_URL}/polls/nearby?radius=10`);
      setNearbyCount(nearbyRes.data.length);

      // 2. Fetch joined chatrooms (active teams)
      const roomsRes = await axios.get(`${API_URL}/chat/rooms`);
      setActiveRooms(roomsRes.data);

      // 3. Fetch user's join requests
      const requestsRes = await axios.get(`${API_URL}/requests/my-requests`);
      setMyRequests(requestsRes.data);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, location]); // reload when user location simulated change!

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        <span className="text-sm text-zinc-400">Authenticating developer session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar />

        {/* Main Dashboard Canvas */}
        <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Welcome HUD */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 border-violet-500/10 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full filter blur-2xl"></div>
            <div className="z-10 flex items-center gap-4 text-left">
              <img
                src={user.profilePhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-violet-500/20 shadow-xl"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-white">Hello, {user.name}</h1>
                  <span className="bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded text-[10px] font-bold">
                    {user.experienceLevel}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 max-w-md leading-relaxed">
                  {user.bio || "No bio added yet. Visit your developer profile page to configure skills, completed projects, and socials!"}
                </p>
              </div>
            </div>

            <div className="flex gap-3 z-10 w-full md:w-auto">
              <Link
                href="/poll/create"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl text-xs font-bold hover:from-violet-700 hover:to-fuchsia-700 transition-all shadow-md shadow-violet-600/10"
              >
                <Plus className="w-4 h-4" />
                Create Team Poll
              </Link>
              <Link
                href="/map"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 border border-white/5 text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors"
              >
                <Compass className="w-4 h-4" />
                Find Nearby Teams
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Scanning 10km Proximity</span>
                <span className="text-3xl font-black text-white block mt-1">{nearbyCount}</span>
                <span className="text-[10px] text-violet-400 font-semibold flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-violet-400" /> Active team polls
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Compass className="w-6 h-6 text-violet-400" />
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Collaborative Teams</span>
                <span className="text-3xl font-black text-white block mt-1">{activeRooms.length}</span>
                <span className="text-[10px] text-fuchsia-400 font-semibold mt-1 block">Active chat workspaces</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-fuchsia-400" />
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Join Applications</span>
                <span className="text-3xl font-black text-white block mt-1">{myRequests.length}</span>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">Sent requests logged</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Send className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Grid Layouts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
            {/* Active Teams */}
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" /> My Workspace Teams
              </h2>

              {loading ? (
                <div className="glass-panel p-8 rounded-2xl border border-white/5 flex justify-center py-12">
                  <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                </div>
              ) : activeRooms.length === 0 ? (
                <div className="glass-panel p-8 rounded-2xl border border-white/5 text-center text-zinc-500 py-12 text-xs">
                  You are not a member of any project team workspaces yet. 
                  <Link href="/map" className="block text-violet-400 font-extrabold hover:underline mt-2">
                    Open Proximity Map and Apply!
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeRooms.map((room) => {
                    let catColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
                    if (room.projectCategory === 'hackathon') catColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                    else if (room.projectCategory === 'freelance') catColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
                    else if (room.projectCategory === 'college') catColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                    
                    return (
                      <div key={room.id} className="glass-panel p-4.5 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${catColor}`}>
                              {room.projectCategory}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-medium">👥 {room.membersCount} members</span>
                          </div>
                          <h3 className="text-sm font-extrabold text-white truncate">{room.roomName}</h3>
                          <p className="text-xs text-zinc-400 truncate mt-1">{room.projectDescription}</p>
                        </div>
                        <Link
                          href={`/chat`}
                          className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-violet-600/10 shrink-0"
                        >
                          Enter Chat
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sent Join Requests status */}
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-fuchsia-400" /> Submitted Join Requests
              </h2>

              {loading ? (
                <div className="glass-panel p-8 rounded-2xl border border-white/5 flex justify-center py-12">
                  <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                </div>
              ) : myRequests.length === 0 ? (
                <div className="glass-panel p-8 rounded-2xl border border-white/5 text-center text-zinc-500 py-12 text-xs">
                  No submitted join requests logged. Discover and apply to teams from the maps.
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((req) => {
                    let statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                    if (req.status === 'accepted') statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                    else if (req.status === 'rejected') statusColor = 'text-red-400 bg-red-500/10 border-red-500/20';

                    return (
                      <div key={req.id} className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-sm font-extrabold text-white truncate">{req.pollTitle}</h3>
                          <span className="text-[10px] text-zinc-500 block mt-1">Submitted on: {new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg border ${statusColor}`}>
                            {req.status}
                          </span>
                          {req.status === 'accepted' && (
                            <Link
                              href="/chat"
                              className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              title="Go to chat"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
