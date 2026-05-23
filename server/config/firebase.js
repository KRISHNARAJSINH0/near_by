const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let db;
let auth;
let isMock = false;

// Custom high-fidelity In-Memory Mock Firestore
class MockDocumentSnapshot {
  constructor(id, data) {
    this.id = id;
    this._data = data;
    this.exists = data !== null && data !== undefined;
  }
  data() {
    return this._data ? JSON.parse(JSON.stringify(this._data)) : null;
  }
}

class MockQuerySnapshot {
  constructor(docs) {
    this.docs = docs;
    this.empty = docs.length === 0;
  }
}

class MockDocumentReference {
  constructor(collectionName, docId, store) {
    this.collectionName = collectionName;
    this.id = docId;
    this.store = store;
  }

  async get() {
    const data = this.store[this.collectionName]?.[this.id] || null;
    return new MockDocumentSnapshot(this.id, data);
  }

  async set(data, options = {}) {
    if (!this.store[this.collectionName]) {
      this.store[this.collectionName] = {};
    }
    const current = this.store[this.collectionName][this.id] || {};
    if (options.merge) {
      this.store[this.collectionName][this.id] = { ...current, ...data };
    } else {
      this.store[this.collectionName][this.id] = data;
    }
    return { id: this.id };
  }

  async update(data) {
    if (!this.store[this.collectionName]?.[this.id]) {
      throw new Error(`Document ${this.id} does not exist in collection ${this.collectionName}`);
    }
    this.store[this.collectionName][this.id] = {
      ...this.store[this.collectionName][this.id],
      ...data
    };
    return { id: this.id };
  }

  async delete() {
    if (this.store[this.collectionName]?.[this.id]) {
      delete this.store[this.collectionName][this.id];
    }
  }
}

class MockCollectionReference {
  constructor(collectionName, store) {
    this.collectionName = collectionName;
    this.store = store;
    this.filters = [];
    this.limitVal = null;
    this.orderByField = null;
    this.orderByDir = 'asc';
  }

  doc(id) {
    const docId = id || Math.random().toString(36).substring(2, 15);
    return new MockDocumentReference(this.collectionName, docId, this.store);
  }

  async add(data) {
    const docId = Math.random().toString(36).substring(2, 15);
    if (!this.store[this.collectionName]) {
      this.store[this.collectionName] = {};
    }
    this.store[this.collectionName][docId] = { ...data, id: docId };
    return new MockDocumentReference(this.collectionName, docId, this.store);
  }

  where(field, op, value) {
    this.filters.push({ field, op, value });
    return this;
  }

  limit(n) {
    this.limitVal = n;
    return this;
  }

  orderBy(field, dir = 'asc') {
    this.orderByField = field;
    this.orderByDir = dir;
    return this;
  }

  async get() {
    const colData = this.store[this.collectionName] || {};
    let docs = Object.keys(colData).map(id => {
      const data = colData[id];
      return new MockDocumentSnapshot(id, data);
    });

    // Apply filters
    for (const filter of this.filters) {
      docs = docs.filter(doc => {
        const docData = doc.data();
        const val = docData?.[filter.field];
        switch (filter.op) {
          case '==': return val == filter.value;
          case '!=': return val != filter.value;
          case '>=': return val >= filter.value;
          case '<=': return val <= filter.value;
          case '>': return val > filter.value;
          case '<': return val < filter.value;
          case 'array-contains': return Array.isArray(val) && val.includes(filter.value);
          default: return true;
        }
      });
    }

    // Apply sorting
    if (this.orderByField) {
      docs.sort((a, b) => {
        const aVal = a.data()?.[this.orderByField];
        const bVal = b.data()?.[this.orderByField];
        if (aVal < bVal) return this.orderByDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.orderByDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply limits
    if (this.limitVal !== null) {
      docs = docs.slice(0, this.limitVal);
    }

    return new MockQuerySnapshot(docs);
  }
}

class MockFirestore {
  constructor() {
    this.store = {
      users: {},
      polls: {},
      joinRequests: {},
      chatRooms: {},
      messages: {},
      notifications: {}
    };
  }

  collection(name) {
    return new MockCollectionReference(name, this.store);
  }
}

// In-Memory Database seed data helper
function seedMockDB(mockDb) {
  // Seed a sample user
  mockDb.store.users['mock-uid-alice'] = {
    uid: 'mock-uid-alice',
    name: 'Alice Cooper',
    email: 'alice@geoteam.com',
    bio: 'Fullstack Developer looking for startup co-founders. Love WebSockets and Map interfaces.',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    skills: ['React', 'Node.js', 'Express', 'Tailwind', 'Socket.IO'],
    experienceLevel: 'Senior',
    github: 'https://github.com/alicecooper',
    linkedin: 'https://linkedin.com/in/alicecooper',
    completedProjects: ['Realtime Draw', 'Map Finder'],
    teamHistory: [],
    latitude: 19.0760, // Mumbai Center
    longitude: 72.8777,
    createdAt: new Date().toISOString()
  };

  mockDb.store.users['mock-uid-bob'] = {
    uid: 'mock-uid-bob',
    name: 'Bob Ross',
    email: 'bob@geoteam.com',
    bio: 'UX Designer looking to build amazing hackathon teams. Focused on glassmorphism.',
    profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    skills: ['Framer Motion', 'Figma', 'React', 'Tailwind'],
    experienceLevel: 'Intermediate',
    github: 'https://github.com/bobross',
    linkedin: 'https://linkedin.com/in/bobross',
    completedProjects: ['Beautiful Paint', 'Glass Design'],
    teamHistory: [],
    latitude: 19.0820, // ~1km away from Mumbai Center
    longitude: 72.8820,
    createdAt: new Date().toISOString()
  };

  // Seed sample polls
  mockDb.store.polls['mock-poll-1'] = {
    id: 'mock-poll-1',
    title: 'AI Startup Builder',
    description: 'We are building a nearby startup matchmaker with live maps and voice rooms. Need backend devs!',
    category: 'startup',
    requiredSkills: ['Node.js', 'Socket.IO', 'Express'],
    visibilityRadius: 10,
    createdBy: 'mock-uid-alice',
    members: ['mock-uid-alice'],
    maxMembers: 5,
    latitude: 19.0760,
    longitude: 72.8777,
    createdAt: new Date().toISOString()
  };

  mockDb.store.polls['mock-poll-2'] = {
    id: 'mock-poll-2',
    title: 'Fintech Hackathon',
    description: 'NextGen fintech hackathon. Fast execution, visual dashboard, Web3 connections.',
    category: 'hackathon',
    requiredSkills: ['React', 'Framer Motion', 'Solidity'],
    visibilityRadius: 5,
    createdBy: 'mock-uid-bob',
    members: ['mock-uid-bob'],
    maxMembers: 4,
    latitude: 19.0820,
    longitude: 72.8820,
    createdAt: new Date().toISOString()
  };

  // Seed chat rooms
  mockDb.store.chatRooms['mock-poll-1'] = {
    id: 'mock-poll-1',
    roomName: 'AI Startup Builder Chat',
    pollId: 'mock-poll-1',
    members: ['mock-uid-alice']
  };

  mockDb.store.chatRooms['mock-poll-2'] = {
    id: 'mock-poll-2',
    roomName: 'Fintech Hackathon Chat',
    pollId: 'mock-poll-2',
    members: ['mock-uid-bob']
  };

  // Seed message history
  mockDb.store.messages['msg-1'] = {
    id: 'msg-1',
    sender: 'mock-uid-alice',
    senderName: 'Alice Cooper',
    senderPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    roomId: 'mock-poll-1',
    message: 'Welcome to our project chat room! Let\'s build something awesome.',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  };
}

try {
  // If FIREBASE_SERVICE_ACCOUNT_KEY env var is present, parse it and initialize real admin
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('Initializing Real Firebase Admin SDK using Environment Variables...');
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      })
    });
    
    db = admin.firestore();
    auth = admin.auth();
    isMock = false;
    console.log('Firebase Admin SDK initialized successfully!');
  } else {
    // If no credentials, fall back to InMemoryMock
    console.warn('Firebase Credentials not provided in environment variables.');
    console.warn('Falling back to local in-memory Mock Firestore...');
    db = new MockFirestore();
    seedMockDB(db);
    isMock = true;
  }
} catch (error) {
  console.error('Firebase Admin SDK initialization failed:', error);
  console.warn('Falling back to local in-memory Mock Firestore...');
  db = new MockFirestore();
  seedMockDB(db);
  isMock = true;
}

module.exports = {
  db,
  auth,
  isMock
};
