const { db } = require('../config/firebase');

exports.getMyRooms = async (req, res) => {
  try {
    const userId = req.user.uid;

    const querySnapshot = await db.collection('chatRooms')
      .where('members', 'array-contains', userId)
      .get();

    const rooms = [];
    for (const doc of querySnapshot.docs) {
      const roomData = doc.data();

      // Fetch the details of the poll (project details)
      const pollDoc = await db.collection('polls').doc(roomData.pollId).get();
      const pollData = pollDoc.exists ? pollDoc.data() : null;

      if (pollData) {
        rooms.push({
          id: doc.id,
          roomName: roomData.roomName,
          pollId: roomData.pollId,
          projectCategory: pollData.category,
          projectDescription: pollData.description,
          membersCount: roomData.members.length,
          lastUpdated: roomData.createdAt
        });
      }
    }

    return res.status(200).json(rooms);
  } catch (error) {
    console.error('Get chatrooms error:', error);
    return res.status(500).json({ message: 'Failed to fetch chatrooms. Server error.' });
  }
};

exports.getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.uid;

    // 1. Verify user is a member of this chatroom
    const roomDoc = await db.collection('chatRooms').doc(roomId).get();
    if (!roomDoc.exists) {
      return res.status(404).json({ message: 'Chatroom not found.' });
    }

    const roomData = roomDoc.data();
    if (!roomData.members.includes(userId)) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this team room.' });
    }

    // 2. Fetch history messages
    const querySnapshot = await db.collection('messages')
      .where('roomId', '==', roomId)
      .orderBy('createdAt', 'asc')
      .limit(100) // retrieve latest 100 messages
      .get();

    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({
      roomName: roomData.roomName,
      members: roomData.members,
      messages
    });
  } catch (error) {
    console.error('Get room messages error:', error);
    return res.status(500).json({ message: 'Failed to fetch messages. Server error.' });
  }
};
