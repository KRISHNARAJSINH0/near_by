const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

const JWT_SECRET = process.env.JWT_SECRET || 'geoteam_premium_secret_key_2026';

exports.register = async (req, res) => {
  try {
    const { name, email, password, bio, skills, experienceLevel, github, linkedin, latitude, longitude } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Check if user already exists
    const usersRef = db.collection('users');
    const existingUserQuery = await usersRef.where('email', '==', email).get();
    if (!existingUserQuery.empty) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default values
    const profilePhoto = req.body.profilePhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
    const parsedSkills = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []);
    
    // Default location coordinates: fallback to Mumbai center if not supplied
    const userLat = latitude !== undefined ? parseFloat(latitude) : 19.0760;
    const userLng = longitude !== undefined ? parseFloat(longitude) : 72.8777;

    const newUser = {
      name,
      email,
      password: hashedPassword, // Stored securely
      profilePhoto,
      bio: bio || '',
      skills: parsedSkills,
      experienceLevel: experienceLevel || 'Beginner',
      github: github || '',
      linkedin: linkedin || '',
      completedProjects: [],
      teamHistory: [],
      latitude: userLat,
      longitude: userLng,
      createdAt: new Date().toISOString()
    };

    // Save user in Firestore
    const docRef = await usersRef.add(newUser);
    const userId = docRef.id;

    // Sign JWT
    const token = jwt.sign({ uid: userId, email }, JWT_SECRET, { expiresIn: '7d' });

    // Exclude password in response
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      token,
      user: { uid: userId, ...userWithoutPassword }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Registration failed. Server error.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user in Firestore
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('email', '==', email).get();

    if (querySnapshot.empty) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Sign JWT
    const token = jwt.sign({ uid: userDoc.id, email }, JWT_SECRET, { expiresIn: '7d' });

    // Exclude password in response
    const { password: _, ...userWithoutPassword } = userData;

    return res.status(200).json({
      token,
      user: { uid: userDoc.id, ...userWithoutPassword }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed. Server error.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const { password, ...userWithoutPassword } = req.user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Failed to fetch profile. Server error.' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userDoc = await db.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const { password, ...userWithoutPassword } = userDoc.data();
    return res.status(200).json({ uid: userDoc.id, ...userWithoutPassword });
  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({ message: 'Failed to fetch user profile.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, bio, skills, experienceLevel, github, linkedin, completedProjects, latitude, longitude } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (skills) updates.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    if (experienceLevel) updates.experienceLevel = experienceLevel;
    if (github !== undefined) updates.github = github;
    if (linkedin !== undefined) updates.linkedin = linkedin;
    if (completedProjects) updates.completedProjects = completedProjects;
    if (latitude !== undefined) updates.latitude = parseFloat(latitude);
    if (longitude !== undefined) updates.longitude = parseFloat(longitude);

    await db.collection('users').doc(uid).update(updates);

    // Fetch updated document
    const updatedDoc = await db.collection('users').doc(uid).get();
    const { password, ...userWithoutPassword } = updatedDoc.data();

    return res.status(200).json({
      message: 'Profile updated successfully!',
      user: { uid, ...userWithoutPassword }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Failed to update profile. Server error.' });
  }
};
