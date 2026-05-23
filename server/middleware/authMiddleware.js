const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

const JWT_SECRET = process.env.JWT_SECRET || 'geoteam_premium_secret_key_2026';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authorization denied. Token is empty.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch the user from Firestore
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found.' });
    }

    req.user = {
      uid: userDoc.id,
      ...userDoc.data()
    };
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(401).json({ message: 'Token is invalid or has expired.' });
  }
};

module.exports = authMiddleware;
