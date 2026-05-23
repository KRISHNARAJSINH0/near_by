const { db } = require('../config/firebase');

// Maps socket IDs to user details for active coordinates scanning
const activeUsers = new Map(); // socket.id -> { uid, name, latitude, longitude }
// Maps user UIDs to their socket IDs for direct notifications
const userSockets = new Map(); // uid -> socket.id

// Haversine formula for distance check
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // 1. Register User Socket & Location
    socket.on('register_user', ({ uid, name, latitude, longitude }) => {
      if (!uid) return;
      
      activeUsers.set(socket.id, { uid, name, latitude, longitude });
      userSockets.set(uid, socket.id);
      
      console.log(`User registered: ${name} (${uid}) at [${latitude}, ${longitude}]`);
      
      // Broadcast online status to rooms
      io.emit('user_status_change', { uid, status: 'online' });
    });

    // 2. Update User Location dynamically
    socket.on('update_location', ({ latitude, longitude }) => {
      const user = activeUsers.get(socket.id);
      if (user) {
        user.latitude = latitude;
        user.longitude = longitude;
        activeUsers.set(socket.id, user);
        console.log(`Updated location for ${user.name}: [${latitude}, ${longitude}]`);
      }
    });

    // 3. Join a private team room
    socket.on('join_room', async ({ roomId, uid }) => {
      try {
        if (!roomId || !uid) return;

        // Verify membership in database
        const roomDoc = await db.collection('chatRooms').doc(roomId).get();
        if (!roomDoc.exists) return;

        const roomData = roomDoc.data();
        if (!roomData.members.includes(uid)) {
          socket.emit('error_message', { message: 'You are not a member of this chatroom.' });
          return;
        }

        socket.join(roomId);
        console.log(`User ${uid} joined socket room: ${roomId}`);
      } catch (error) {
        console.error('Error joining socket room:', error);
      }
    });

    // 4. Send Message inside room
    socket.on('send_message', async ({ roomId, sender, senderName, senderPhoto, message }) => {
      try {
        if (!roomId || !sender || !message) return;

        const newMessage = {
          sender,
          senderName,
          senderPhoto: senderPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(senderName)}`,
          roomId,
          message,
          createdAt: new Date().toISOString()
        };

        // Save in database
        const messageRef = await db.collection('messages').add(newMessage);
        newMessage.id = messageRef.id;

        // Emit to all members in room
        io.to(roomId).emit('receive_message', newMessage);

        // Optional: Notify members who are not currently online or focusing this room
        const roomDoc = await db.collection('chatRooms').doc(roomId).get();
        if (roomDoc.exists) {
          const roomData = roomDoc.data();
          
          roomData.members.forEach(memberUid => {
            if (memberUid !== sender) {
              const memberSocketId = userSockets.get(memberUid);
              
              // If member is online, send a socket-level notification header
              if (memberSocketId) {
                io.to(memberSocketId).emit('new_chat_notification', {
                  roomId,
                  senderName,
                  messageSnippet: message.substring(0, 50),
                  createdAt: new Date().toISOString()
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error sending socket message:', error);
      }
    });

    // 5. Typing Indicators
    socket.on('typing', ({ roomId, uid, name, isTyping }) => {
      socket.to(roomId).emit('user_typing', { uid, name, isTyping });
    });

    // 6. Handle Disconnection
    socket.on('disconnect', () => {
      const user = activeUsers.get(socket.id);
      if (user) {
        console.log(`User disconnected: ${user.name} (${user.uid})`);
        
        io.emit('user_status_change', { uid: user.uid, status: 'offline' });
        
        userSockets.delete(user.uid);
        activeUsers.delete(socket.id);
      } else {
        console.log(`Socket disconnected: ${socket.id}`);
      }
    });
  });

  // Export a function to trigger real-time geo-location notifications when a poll is created
  // This calculates proximity and distributes alerts directly.
  return {
    broadcastNearbyPoll: async (poll) => {
      try {
        const { id, title, category, latitude, longitude, visibilityRadius, createdBy } = poll;
        console.log(`Broadcasting nearby poll alert for "${title}"...`);

        // Get creator name
        const creatorDoc = await db.collection('users').doc(createdBy).get();
        const creatorName = creatorDoc.exists ? creatorDoc.data().name : 'Someone';

        activeUsers.forEach((userInfo, socketId) => {
          // Do not notify creator
          if (userInfo.uid === createdBy) return;

          const distance = calculateDistance(latitude, longitude, userInfo.latitude, userInfo.longitude);
          if (distance <= visibilityRadius) {
            console.log(`Notifying ${userInfo.name} about nearby poll "${title}" (Distance: ${distance.toFixed(2)}km)`);
            
            // Emit live popup socket event
            io.to(socketId).emit('nearby_poll_alert', {
              pollId: id,
              title,
              category,
              creatorName,
              distance: parseFloat(distance.toFixed(2)),
              message: `${creatorName} created a new nearby ${category} team: "${title}" within ${distance.toFixed(1)} km!`
            });
          }
        });
      } catch (error) {
        console.error('Error broadcasting nearby poll:', error);
      }
    }
  };
};
