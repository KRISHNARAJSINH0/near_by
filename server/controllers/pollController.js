const { db } = require('../config/firebase');

// Haversine formula to compute distance between two points in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
}

exports.createPoll = async (req, res) => {
  try {
    const { title, description, category, requiredSkills, visibilityRadius, maxMembers, latitude, longitude } = req.body;
    const createdBy = req.user.uid;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required.' });
    }

    const pollLat = (latitude !== undefined && latitude !== null) ? parseFloat(latitude) : (req.user && req.user.latitude !== undefined && req.user.latitude !== null ? parseFloat(req.user.latitude) : 19.0760);
    const pollLng = (longitude !== undefined && longitude !== null) ? parseFloat(longitude) : (req.user && req.user.longitude !== undefined && req.user.longitude !== null ? parseFloat(req.user.longitude) : 72.8777);

    const newPoll = {
      title,
      description,
      category, // startup, hackathon, freelance, college
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills ? requiredSkills.split(',').map(s => s.trim()) : []),
      visibilityRadius: visibilityRadius ? parseFloat(visibilityRadius) : 10,
      createdBy,
      members: [createdBy],
      maxMembers: maxMembers ? parseInt(maxMembers) : 5,
      latitude: pollLat,
      longitude: pollLng,
      createdAt: new Date().toISOString()
    };

    // Save in Firestore
    const pollRef = await db.collection('polls').add(newPoll);
    const pollId = pollRef.id;

    // Automatically create a associated chat room
    await db.collection('chatRooms').doc(pollId).set({
      id: pollId,
      roomName: `${title} Chat`,
      pollId: pollId,
      members: [createdBy],
      createdAt: new Date().toISOString()
    });

    const createdPoll = { id: pollId, ...newPoll };

    // Broadcast nearby poll notification in real-time to close users
    const socketHandler = req.app.get('socketHandler');
    if (socketHandler && typeof socketHandler.broadcastNearbyPoll === 'function') {
      socketHandler.broadcastNearbyPoll(createdPoll);
    }

    return res.status(201).json({
      message: 'Poll and team workspace created successfully!',
      poll: createdPoll
    });
  } catch (error) {
    console.error('Create poll error:', error);
    return res.status(500).json({ message: 'Failed to create poll. Server error.' });
  }
};

exports.getNearbyPolls = async (req, res) => {
  try {
    // Current user's location or request coordinates
    const userLat = (req.query.latitude !== undefined && req.query.latitude !== null) ? parseFloat(req.query.latitude) : (req.user && req.user.latitude !== undefined && req.user.latitude !== null ? parseFloat(req.user.latitude) : 19.0760);
    const userLng = (req.query.longitude !== undefined && req.query.longitude !== null) ? parseFloat(req.query.longitude) : (req.user && req.user.longitude !== undefined && req.user.longitude !== null ? parseFloat(req.user.longitude) : 72.8777);
    const radius = req.query.radius ? parseFloat(req.query.radius) : 10; // Default: 10km

    // Approximate bounding box search for Firestore
    // 1 degree of latitude is ~111.045 km
    const deltaLat = radius / 111.045;
    const minLat = userLat - deltaLat;
    const maxLat = userLat + deltaLat;

    // Approximate longitude calculation based on latitude
    const cosLat = Math.cos(userLat * Math.PI / 180);
    const deltaLng = radius / (111.045 * Math.abs(cosLat));
    const minLng = userLng - deltaLng;
    const maxLng = userLng + deltaLng;

    // Query Firestore filtering by latitude bounding box
    const pollsRef = db.collection('polls');
    const querySnapshot = await pollsRef
      .where('latitude', '>=', minLat)
      .where('latitude', '<=', maxLat)
      .get();

    const nearbyPolls = [];

    // Filter documents by longitude bounding box and exact Haversine distance
    for (const doc of querySnapshot.docs) {
      const poll = doc.data();
      const pollLat = poll.latitude;
      const pollLng = poll.longitude;

      if (pollLng >= minLng && pollLng <= maxLng) {
        const distance = calculateDistance(userLat, userLng, pollLat, pollLng);
        if (distance <= radius) {
          // Fetch creator name for display
          const creatorDoc = await db.collection('users').doc(poll.createdBy).get();
          const creatorData = creatorDoc.exists ? creatorDoc.data() : { name: 'Unknown User' };

          nearbyPolls.push({
            id: doc.id,
            ...poll,
            distance: parseFloat(distance.toFixed(2)),
            creatorName: creatorData.name,
            creatorPhoto: creatorData.profilePhoto
          });
        }
      }
    }

    // Sort by closest distance
    nearbyPolls.sort((a, b) => a.distance - b.distance);

    return res.status(200).json(nearbyPolls);
  } catch (error) {
    console.error('Get nearby polls error:', error);
    return res.status(500).json({ message: 'Failed to fetch nearby polls.' });
  }
};

exports.getPollDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const pollDoc = await db.collection('polls').doc(id).get();
    
    if (!pollDoc.exists) {
      return res.status(404).json({ message: 'Poll not found.' });
    }

    const pollData = pollDoc.data();

    // Fetch creator details
    const creatorDoc = await db.collection('users').doc(pollData.createdBy).get();
    const creator = creatorDoc.exists ? { uid: creatorDoc.id, ...creatorDoc.data() } : null;

    // Fetch details of all members
    const memberDetails = [];
    if (pollData.members && pollData.members.length > 0) {
      for (const memberId of pollData.members) {
        const memberDoc = await db.collection('users').doc(memberId).get();
        if (memberDoc.exists) {
          const { password, ...memberInfo } = memberDoc.data();
          memberDetails.push({ uid: memberDoc.id, ...memberInfo });
        }
      }
    }

    // Calculate distance from logged in user
    const userLat = (req.user && req.user.latitude !== undefined && req.user.latitude !== null) ? parseFloat(req.user.latitude) : 19.0760;
    const userLng = (req.user && req.user.longitude !== undefined && req.user.longitude !== null) ? parseFloat(req.user.longitude) : 72.8777;
    const distance = calculateDistance(userLat, userLng, pollData.latitude, pollData.longitude);

    return res.status(200).json({
      id: pollDoc.id,
      ...pollData,
      distance: parseFloat(distance.toFixed(2)),
      creator,
      memberDetails
    });
  } catch (error) {
    console.error('Get poll details error:', error);
    return res.status(500).json({ message: 'Failed to fetch poll details.' });
  }
};
