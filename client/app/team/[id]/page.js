'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Compass, Users, Code, Award, Send, CheckCircle, XCircle, ArrowLeft, Loader2, Sparkles, MapPin, ExternalLink } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function TeamDetailsPage({ params }) {
  const unwrappedParams = use(params);
  const teamId = unwrappedParams.id;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [poll, setPoll] = useState(null);
  const [requests, setRequests] = useState([]);
  const [myRequestStatus, setMyRequestStatus] = useState(null); // 'pending', 'accepted', 'rejected', or null
  const [loading, setLoading] = useState(true);
  const [reqLoading, setReqLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  const loadTeamDetails = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // 1. Fetch Poll details
      const pollRes = await axios.get(`${API_URL}/polls/${teamId}`);
      setPoll(pollRes.data);

      // Check if logged in user is owner
      const isOwner = pollRes.data.createdBy === user.uid;

      if (isOwner) {
        // 2. Fetch all pending join requests for owners to manage
        const requestsRes = await axios.get(`${API_URL}/requests/poll/${teamId}`);
        setRequests(requestsRes.data);
      } else {
        // 3. For visitors, check if they have already sent a request
        const myReqsRes = await axios.get(`${API_URL}/requests/my-requests`);
        const found = myReqsRes.data.find(r => r.pollId === teamId);
        if (found) {
          setMyRequestStatus(found.status);
        }
      }
    } catch (err) {
      console.error('Error fetching team details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTeamDetails();
    }
  }, [user, teamId]);

  const handleSendJoinRequest = async () => {
    setReqLoading(true);
    try {
      await axios.post(`${API_URL}/requests/join`, { pollId: teamId });
      setMyRequestStatus('pending');
      loadTeamDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit join request.');
    } finally {
      setReqLoading(false);
    }
  };

  const handleProcessRequest = async (requestId, status) => {
    setActionLoadingId(requestId);
    try {
      await axios.post(`${API_URL}/requests/respond/${requestId}`, { status });
      // Refresh requests and active members lists
      loadTeamDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        <span className="text-sm text-zinc-400">Loading proximity workspace details...</span>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <div className="flex-1 p-8 text-center text-zinc-500">Poll not found.</div>
        </div>
      </div>
    );
  }

  const isOwner = poll.createdBy === user.uid;
  const isMember = poll.members.includes(user.uid);
  const isFull = poll.members.length >= poll.maxMembers;

  let catColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
  if (poll.category === 'hackathon') catColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  else if (poll.category === 'freelance') catColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
  else if (poll.category === 'college') catColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full space-y-6">
          <Link
            href="/map"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 font-bold uppercase mb-2 tracking-wider text-left"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-500" /> Back to Proximity Map
          </Link>

          {/* Team Detail Card */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/8 space-y-6 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/5 rounded-full filter blur-3xl"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full border ${catColor}`}>
                    {poll.category}
                  </span>
                  <span className="text-xs text-violet-400 font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {poll.distance} km away from you
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{poll.title}</h1>
              </div>

              {/* Dynamic Application Action Trigger */}
              <div className="shrink-0">
                {isOwner ? (
                  <span className="bg-violet-500/10 border border-violet-500/20 text-violet-300 px-4 py-2.5 rounded-xl text-xs font-bold block text-center">
                    👑 You own this team poll
                  </span>
                ) : isMember ? (
                  <Link
                    href="/chat"
                    className="px-5 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-600/10 block text-center"
                  >
                    Enter Private Workspace Chat &rarr;
                  </Link>
                ) : myRequestStatus === 'pending' ? (
                  <button
                    disabled
                    className="w-full px-5 py-3 bg-zinc-900 border border-white/5 text-zinc-500 rounded-xl text-xs font-bold text-center cursor-not-allowed"
                  >
                    ⌛ Join Request Pending
                  </button>
                ) : myRequestStatus === 'rejected' ? (
                  <button
                    disabled
                    className="w-full px-5 py-3 bg-red-950/10 border border-red-500/10 text-red-400 rounded-xl text-xs font-bold text-center cursor-not-allowed"
                  >
                    ❌ Join Request Declined
                  </button>
                ) : isFull ? (
                  <button
                    disabled
                    className="w-full px-5 py-3 bg-zinc-900 border border-white/5 text-zinc-600 rounded-xl text-xs font-bold text-center cursor-not-allowed"
                  >
                    👥 Team Capacity Full
                  </button>
                ) : (
                  <button
                    onClick={handleSendJoinRequest}
                    disabled={reqLoading}
                    className="w-full px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-600/10 flex items-center justify-center gap-1.5"
                  >
                    {reqLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Join Request</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 border-t border-white/5 pt-5 z-10 relative">
              <h3 className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Project Mission & Roadmap</h3>
              <p className="text-zinc-300 text-sm leading-relaxed">{poll.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-white/5 pt-5 z-10 relative">
              <div>
                <h3 className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider mb-2">Required Core Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {poll.requiredSkills.map((skill, index) => (
                    <span key={index} className="text-xs text-zinc-300 bg-zinc-950 border border-white/5 px-3 py-1 rounded-lg font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Team Capacity Index</span>
                <span className="text-2xl font-black text-white mt-1">
                  {poll.members.length} / {poll.maxMembers} slots filled
                </span>
                <div className="w-full bg-zinc-950 border border-white/5 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 h-full rounded-full transition-all"
                    style={{ width: `${(poll.members.length / poll.maxMembers) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic grid: Members & Owner Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            {/* Joined Members */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" /> Active Workspace Collaborators
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {poll.memberDetails?.map((member) => (
                  <div key={member.uid} className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col justify-between gap-3 relative hover:border-violet-500/20 transition-all">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.profilePhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.name}`}
                        alt={member.name}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-violet-500/10 shadow"
                      />
                      <div className="min-w-0">
                        <span className="font-extrabold text-sm text-white truncate block">{member.name}</span>
                        <span className="text-[10px] text-violet-400 font-semibold">{member.experienceLevel}</span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{member.bio || "No bio configured yet."}</p>

                    <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                      <div className="flex flex-wrap gap-1">
                        {member.skills?.slice(0, 2).map((s, idx) => (
                          <span key={idx} className="text-[9px] text-zinc-500 font-semibold bg-zinc-950 px-1.5 py-0.5 rounded border border-white/5">
                            {s}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/profile/${member.uid}`}
                        className="text-[10px] text-violet-400 font-extrabold flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Profile <ExternalLink className="w-3 h-3 text-violet-400" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Owner requests panel dashboard */}
            {isOwner && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-fuchsia-400 animate-pulse" /> Applications
                </h2>

                {requests.length === 0 ? (
                  <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center text-zinc-500 text-xs py-10">
                    No pending join requests logged. When developers nearby apply, they will show up here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((req) => (
                      <div key={req.id} className="glass-panel p-4.5 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={req.userPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.userName}`}
                            alt={req.userName}
                            className="w-10 h-10 rounded-xl object-cover shadow"
                          />
                          <div>
                            <span className="font-extrabold text-xs text-white block">{req.userName}</span>
                            <span className="text-[9px] text-zinc-500 font-semibold uppercase">{req.userExperience}</span>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{req.userBio || "No bio added."}</p>

                        <div className="flex gap-2">
                          {req.userSkills?.slice(0, 3).map((s, idx) => (
                            <span key={idx} className="text-[9px] text-zinc-500 font-semibold bg-zinc-950 px-1.5 py-0.5 rounded border border-white/5">
                              {s}
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-2 border-t border-white/5 pt-3">
                          <button
                            onClick={() => handleProcessRequest(req.id, 'accepted')}
                            disabled={actionLoadingId === req.id}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => handleProcessRequest(req.id, 'rejected')}
                            disabled={actionLoadingId === req.id}
                            className="flex-1 py-2 bg-zinc-900 border border-white/5 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
