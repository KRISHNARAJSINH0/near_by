'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MapView from '@/components/Map/MapView';
import RadiusFilter from '@/components/Map/RadiusFilter';
import { Compass, Users, Code, ArrowUpRight, Search, MapPin, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function MapPage() {
  const { user, loading: authLoading } = useAuth();
  const { location } = useLocation();
  const router = useRouter();

  const [polls, setPolls] = useState([]);
  const [radius, setRadius] = useState(10); // Default: 10km
  const [loading, setLoading] = useState(true);
  const [selectedPoll, setSelectedPoll] = useState(null);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  // Load nearby polls based on coordinates & selected radius
  const fetchNearby = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/polls/nearby?latitude=${location.latitude}&longitude=${location.longitude}&radius=${radius}`
      );
      setPolls(response.data);
    } catch (err) {
      console.error('Failed to load nearby polls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearby();
  }, [user, location, radius]); // Refetch when radius or simulated coordinates change!

  const handleMarkerClick = (poll) => {
    setSelectedPoll(poll);
    // Scroll selected card into view or highlight it
    const element = document.getElementById(`poll-card-${poll.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

        {/* Map Deck canvas */}
        <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 overflow-hidden">
          
          {/* Header & Radius HUD */}
          <RadiusFilter selectedRadius={radius} onChange={setRadius} />

          {/* Interactive Split-Panel Dashboard */}
          <div className="flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden min-h-[500px]">
            
            {/* Left side list of nearby team cards */}
            <div className="w-full lg:w-[400px] flex flex-col gap-4 overflow-y-auto pr-1 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Nearby team polls ({polls.length})
                </span>
                <span className="text-[10px] text-zinc-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                  Scan: {radius} km
                </span>
              </div>

              {loading ? (
                <div className="flex-1 glass-panel rounded-2xl border border-white/5 flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                </div>
              ) : polls.length === 0 ? (
                <div className="flex-1 glass-panel rounded-2xl border border-white/5 text-center text-zinc-500 p-8 flex flex-col items-center justify-center py-20 text-xs">
                  <MapPin className="w-8 h-8 text-zinc-600 mb-3 animate-pulse" />
                  <p>No active teams found within {radius}km from your simulated coordinates.</p>
                  <p className="mt-1 text-zinc-600">Try expanding your scan radius in the header, or trigger preset coordinates in the navbar!</p>
                  <Link href="/poll/create" className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all shadow-md shadow-violet-600/10">
                    Create the First Poll Here!
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {polls.map((poll) => {
                    const isSelected = selectedPoll?.id === poll.id;
                    
                    let catColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
                    if (poll.category === 'hackathon') catColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                    else if (poll.category === 'freelance') catColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
                    else if (poll.category === 'college') catColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';

                    return (
                      <div
                        id={`poll-card-${poll.id}`}
                        key={poll.id}
                        onClick={() => setSelectedPoll(poll)}
                        className={`glass-panel p-4.5 rounded-2xl border transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'border-violet-500 bg-violet-500/5 shadow-md shadow-violet-500/5'
                            : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${catColor}`}>
                            {poll.category}
                          </span>
                          <span className="text-[10px] text-violet-400 font-bold shrink-0 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-violet-400" /> {poll.distance} km away
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-white leading-tight">{poll.title}</h3>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{poll.description}</p>

                        <div className="flex flex-wrap gap-1 mt-3">
                          {poll.requiredSkills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="text-[9px] font-semibold text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-white/5">
                              {skill}
                            </span>
                          ))}
                          {poll.requiredSkills.length > 3 && (
                            <span className="text-[9px] text-zinc-500 font-bold px-1.5 py-0.5">
                              +{poll.requiredSkills.length - 3} more
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-white/5 mt-4 pt-3.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
                            <Users className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{poll.members.length} / {poll.maxMembers} filled</span>
                          </div>
                          
                          <Link
                            href={`/team/${poll.id}`}
                            className="flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:text-white transition-colors"
                          >
                            Join & Review <ArrowUpRight className="w-3.5 h-3.5 text-violet-400" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right side interactive dark Leaflet map */}
            <div className="flex-1 h-full min-h-[350px] lg:min-h-0">
              <MapView polls={polls} radius={radius} onMarkerClick={handleMarkerClick} />
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
