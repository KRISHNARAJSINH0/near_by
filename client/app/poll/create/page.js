'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Sparkles, Calendar, Compass, Layers, Users, MapPin, Loader2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function CreatePollPage() {
  const { user, loading: authLoading } = useAuth();
  const { location, activePresetName } = useLocation();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'startup',
    requiredSkills: '',
    visibilityRadius: 10,
    maxMembers: 5,
    latitude: 19.0760,
    longitude: 72.8777
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Guard redirects
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  // Load coordinates from LocationContext on mount/update
  useEffect(() => {
    if (location) {
      setFormData(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude
      }));
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post(`${API_URL}/polls/create`, {
        ...formData,
        visibilityRadius: parseFloat(formData.visibilityRadius),
        maxMembers: parseInt(formData.maxMembers),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      });
      
      const newPollId = response.data.poll.id;
      // Direct user to their newly created team details page!
      router.push(`/team/${newPollId}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create team poll.');
    } finally {
      setLoading(false);
    }
  };

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

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 font-bold uppercase mb-4 tracking-wider"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-500" /> Back to Dashboard
          </Link>

          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/8 space-y-6">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-violet-400 animate-pulse" /> Launch a Team Poll
              </h1>
              <p className="text-xs text-zinc-400 mt-1.5">
                Pin your project team on the live map and invite nearby co-founders to collaborate.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-xs font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">Project/Team Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. AI Startup Builder, FinTech Hackathon"
                    className="w-full px-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">Category Domain</label>
                  <div className="relative">
                    <Layers className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 transition-colors appearance-none"
                    >
                      <option value="startup">🟣 Startup Co-founders</option>
                      <option value="hackathon">🟢 Hackathon Team Builders</option>
                      <option value="freelance">🔵 Freelance Workspaces</option>
                      <option value="college">🟡 College Projects</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">Project Description</label>
                <textarea
                  name="description"
                  required
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Outline your tech roadmap, project ambitions, and team mission..."
                  className="w-full px-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">Required Skills (comma separated)</label>
                  <input
                    type="text"
                    name="requiredSkills"
                    required
                    value={formData.requiredSkills}
                    onChange={handleChange}
                    placeholder="e.g. React, Python, WebSockets, Figma"
                    className="w-full px-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">Max Capacity</label>
                    <div className="relative">
                      <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                      <select
                        name="maxMembers"
                        value={formData.maxMembers}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 transition-colors appearance-none"
                      >
                        <option value="2">2 Developer</option>
                        <option value="3">3 Developers</option>
                        <option value="4">4 Developers</option>
                        <option value="5">5 Developers</option>
                        <option value="8">8 Developers</option>
                        <option value="10">10 Developers</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">Scan Visibility</label>
                    <div className="relative">
                      <Compass className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                      <select
                        name="visibilityRadius"
                        value={formData.visibilityRadius}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 transition-colors appearance-none"
                      >
                        <option value="2">2 KM</option>
                        <option value="5">5 KM</option>
                        <option value="10">10 KM</option>
                        <option value="25">25 KM</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Geo location hud pick */}
              <div className="p-4 bg-violet-600/10 border border-violet-500/20 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-violet-400 animate-pulse" />
                  <div>
                    <span className="font-bold text-white block">Geotagging Live coordinates</span>
                    <span className="text-[10px] text-zinc-400">Map coordinates synced automatically to matching presets</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-violet-300 font-bold block">{activePresetName}</span>
                  <span className="text-[9px] text-zinc-500">Latitude: {formData.latitude.toFixed(4)}, Longitude: {formData.longitude.toFixed(4)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl text-sm font-extrabold hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-600/15 focus:outline-none disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Spinning up team workspace...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Launch & Broadcast Proximity Poll</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
