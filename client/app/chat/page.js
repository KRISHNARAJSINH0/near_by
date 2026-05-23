'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Send, Users, MessageSquare, Loader2, Smile, Sparkles, Circle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputText, setInputText] = useState('');
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Typing state
  const [typingUsers, setTypingUsers] = useState(new Map()); // uid -> name
  const typingTimeoutRef = useRef({});

  const chatEndRef = useRef(null);

  // Guard redirects
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  // Load chatrooms on mount
  const loadRooms = async () => {
    if (!user) return;
    try {
      setRoomsLoading(true);
      const response = await axios.get(`${API_URL}/chat/rooms`);
      setRooms(response.data);
      if (response.data.length > 0) {
        // Auto select first room
        handleSelectRoom(response.data[0]);
      }
    } catch (err) {
      console.error('Failed to load chatrooms:', err);
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRooms();
    }
  }, [user]);

  // Handle Socket message listening
  useEffect(() => {
    if (!socket || !activeRoom) return;

    // Join room
    socket.emit('join_room', {
      roomId: activeRoom.id,
      uid: user.uid
    });

    // Listen for incoming messages
    socket.on('receive_message', (message) => {
      if (message.roomId === activeRoom.id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    });

    // Listen for typing events
    socket.on('user_typing', ({ uid, name, isTyping }) => {
      if (uid === user.uid) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (isTyping) {
          next.set(uid, name);
        } else {
          next.delete(uid);
        }
        return next;
      });
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_typing');
    };
  }, [socket, activeRoom]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSelectRoom = async (room) => {
    setActiveRoom(room);
    setMessagesLoading(true);
    setTypingUsers(new Map());
    
    try {
      const response = await axios.get(`${API_URL}/chat/messages/${room.id}`);
      setMessages(response.data.messages);
      
      // Load details of room members
      const pollDetails = await axios.get(`${API_URL}/polls/${room.pollId}`);
      setMembers(pollDetails.data.memberDetails || []);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load room messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRoom || !socket) return;

    // Stop typing alert
    socket.emit('typing', {
      roomId: activeRoom.id,
      uid: user.uid,
      name: user.name,
      isTyping: false
    });

    // Emit live message
    socket.emit('send_message', {
      roomId: activeRoom.id,
      sender: user.uid,
      senderName: user.name,
      senderPhoto: user.profilePhoto,
      message: inputText
    });

    setInputText('');
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    if (!socket || !activeRoom) return;

    // Emit typing status
    socket.emit('typing', {
      roomId: activeRoom.id,
      uid: user.uid,
      name: user.name,
      isTyping: true
    });

    // Clear previous timeout
    if (typingTimeoutRef.current[activeRoom.id]) {
      clearTimeout(typingTimeoutRef.current[activeRoom.id]);
    }

    // Set timeout to clear typing after 2 seconds of inactivity
    typingTimeoutRef.current[activeRoom.id] = setTimeout(() => {
      socket.emit('typing', {
        roomId: activeRoom.id,
        uid: user.uid,
        name: user.name,
        isTyping: false
      });
    }, 2000);
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
    <div className="min-h-screen bg-zinc-950 flex flex-col h-screen overflow-hidden">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        {/* Messaging Layout Deck */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left panel: channels channels list */}
          <div className="w-full md:w-80 border-r border-white/8 bg-zinc-950/40 p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-violet-400" /> Active Channels
              </span>
            </div>

            {roomsLoading ? (
              <div className="flex-1 flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex-1 text-center py-10 text-xs text-zinc-600 leading-normal">
                No active collaboration channels found. Join a team poll first!
              </div>
            ) : (
              <div className="space-y-1">
                {rooms.map((room) => {
                  const isActive = activeRoom?.id === room.id;
                  
                  let catColor = 'bg-purple-500/10 border-purple-500/20 text-purple-400';
                  if (room.projectCategory === 'hackathon') catColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                  else if (room.projectCategory === 'freelance') catColor = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
                  else if (room.projectCategory === 'college') catColor = 'bg-amber-500/10 border-amber-500/20 text-amber-400';

                  return (
                    <button
                      key={room.id}
                      onClick={() => handleSelectRoom(room)}
                      className={`w-full text-left p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                        isActive
                          ? 'border-violet-500/30 bg-violet-600/10 text-white shadow-inner'
                          : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-center font-bold text-xs shrink-0">
                        GT
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded font-black border ${catColor}`}>
                            {room.projectCategory}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold truncate leading-tight">{room.roomName}</h4>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel: Active chat window */}
          <div className="flex-1 flex flex-col bg-zinc-950/60 overflow-hidden relative">
            
            {activeRoom ? (
              <>
                {/* Active header */}
                <div className="px-6 py-4 border-b border-white/8 bg-zinc-950/20 flex items-center justify-between z-10 shrink-0">
                  <div>
                    <h3 className="text-sm font-black text-white">{activeRoom.roomName}</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-sm">{activeRoom.projectDescription}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 font-semibold bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-violet-400" />
                      {members.length} online collaborators
                    </span>
                  </div>
                </div>

                {/* Messages log */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                  {messagesLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 text-xs gap-2">
                      <Sparkles className="w-6 h-6 text-violet-500 animate-bounce" />
                      <span>This private room is successfully locked. Let's begin collaborating!</span>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender === user.uid;
                      return (
                        <div key={msg.id} className={`flex items-start gap-3 text-left max-w-xl ${isMe ? 'ml-auto flex-row-reverse text-right' : ''}`}>
                          {!isMe && (
                            <img
                              src={msg.senderPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderName}`}
                              alt={msg.senderName}
                              className="w-8 h-8 rounded-lg object-cover ring-2 ring-violet-500/10 shadow shrink-0 mt-0.5"
                            />
                          )}
                          <div>
                            <div className={`flex items-center gap-2 mb-1 justify-start ${isMe ? 'flex-row-reverse' : ''}`}>
                              <span className="text-[10px] font-extrabold text-zinc-400">{msg.senderName}</span>
                              <span className="text-[8px] text-zinc-600 font-semibold">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={`p-3 rounded-2xl text-xs leading-normal border shadow-sm ${
                              isMe
                                ? 'bg-gradient-to-r from-violet-600/30 to-violet-600/20 border-violet-500/25 text-violet-100 rounded-tr-none'
                                : 'bg-zinc-900 border-white/5 text-zinc-300 rounded-tl-none'
                            }`}>
                              {msg.message}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Typing alert bar */}
                {typingUsers.size > 0 && (
                  <div className="px-6 py-1 bg-zinc-950/20 text-left text-[10px] text-zinc-500 shrink-0 italic flex items-center gap-2">
                    <Circle className="w-2 h-2 text-violet-400 fill-violet-400 animate-ping" />
                    <span>
                      {Array.from(typingUsers.values()).join(', ')}{' '}
                      {typingUsers.size === 1 ? 'is' : 'are'} typing...
                    </span>
                  </div>
                )}

                {/* Message send form */}
                <form onSubmit={handleSend} className="p-4 border-t border-white/8 bg-zinc-950/30 shrink-0 z-10">
                  <div className="relative flex items-center gap-2 bg-zinc-950 border border-white/5 rounded-2xl p-1.5 focus-within:border-violet-500/50 transition-colors">
                    <input
                      type="text"
                      required
                      value={inputText}
                      onChange={handleInputChange}
                      placeholder={`Message ${activeRoom.roomName}...`}
                      className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-zinc-600 animate-pulse" />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Select a Team Room</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-normal">
                  Private channels are locked for active team collaborators. Choose a list item on the left to start messaging!
                </p>
              </div>
            )}

          </div>

        </main>
      </div>
    </div>
  );
}
