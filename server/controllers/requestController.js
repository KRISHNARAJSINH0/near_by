const { db } = require('../config/firebase');

exports.sendJoinRequest = async (req, res) => {
  try {
    const { pollId } = req.body;
    const userId = req.user.uid;

    if (!pollId) {
      return res.status(400).json({ message: 'Poll ID is required.' });
    }

    // 1. Verify poll exists and isn't full
    const pollDoc = await db.collection('polls').doc(pollId).get();
    if (!pollDoc.exists) {
      return res.status(404).json({ message: 'Team poll not found.' });
    }

    const pollData = pollDoc.data();

    if (pollData.members.includes(userId)) {
      return res.status(400).json({ message: 'You are already a member of this team.' });
    }

    if (pollData.members.length >= pollData.maxMembers) {
      return res.status(400).json({ message: 'This team has already reached its maximum member capacity.' });
    }

    // 2. Check if a pending request already exists
    const requestsRef = db.collection('joinRequests');
    const existingQuery = await requestsRef
      .where('pollId', '==', pollId)
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .get();

    if (!existingQuery.empty) {
      return res.status(400).json({ message: 'You have already submitted a pending request to join this team.' });
    }

    // 3. Create join request
    const newRequest = {
      userId,
      pollId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const docRef = await requestsRef.add(newRequest);

    // 4. Send Notification to Poll Creator
    const notification = {
      recipient: pollData.createdBy,
      sender: userId,
      senderName: req.user.name,
      type: 'request',
      content: `${req.user.name} requested to join your team "${pollData.title}".`,
      relatedId: pollId,
      read: false,
      createdAt: new Date().toISOString()
    };
    await db.collection('notifications').add(notification);

    return res.status(201).json({
      message: 'Join request sent successfully!',
      requestId: docRef.id
    });
  } catch (error) {
    console.error('Send join request error:', error);
    return res.status(500).json({ message: 'Failed to send join request. Server error.' });
  }
};

exports.respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    const ownerId = req.user.uid;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status response. Use "accepted" or "rejected".' });
    }

    // 1. Fetch join request
    const requestRef = db.collection('joinRequests').doc(requestId);
    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) {
      return res.status(404).json({ message: 'Join request not found.' });
    }

    const requestData = requestDoc.data();
    if (requestData.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been processed.' });
    }

    // 2. Fetch poll details and verify ownership
    const pollRef = db.collection('polls').doc(requestData.pollId);
    const pollDoc = await pollRef.get();
    if (!pollDoc.exists) {
      return res.status(404).json({ message: 'Associated team poll not found.' });
    }

    const pollData = pollDoc.data();
    if (pollData.createdBy !== ownerId) {
      return res.status(403).json({ message: 'Unauthorized. Only the team owner can approve requests.' });
    }

    if (status === 'accepted') {
      if (pollData.members.length >= pollData.maxMembers) {
        return res.status(400).json({ message: 'Team has reached its maximum capacity. Cannot accept new members.' });
      }

      // Add user to poll members array
      const updatedMembers = [...pollData.members, requestData.userId];
      await pollRef.update({ members: updatedMembers });

      // Add user to the ChatRoom members array
      const chatRoomRef = db.collection('chatRooms').doc(requestData.pollId);
      const chatRoomDoc = await chatRoomRef.get();
      if (chatRoomDoc.exists) {
        const roomMembers = chatRoomDoc.data().members || [];
        if (!roomMembers.includes(requestData.userId)) {
          await chatRoomRef.update({
            members: [...roomMembers, requestData.userId]
          });
        }
      }
    }

    // 3. Update join request status
    await requestRef.update({ status });

    // 4. Notify applicant
    const notification = {
      recipient: requestData.userId,
      sender: ownerId,
      senderName: req.user.name,
      type: status === 'accepted' ? 'accept' : 'reject',
      content: status === 'accepted'
        ? `Congratulations! Your request to join "${pollData.title}" was accepted!`
        : `Sorry, your request to join "${pollData.title}" was declined.`,
      relatedId: requestData.pollId,
      read: false,
      createdAt: new Date().toISOString()
    };
    await db.collection('notifications').add(notification);

    return res.status(200).json({
      message: `Join request successfully ${status}!`,
      status
    });
  } catch (error) {
    console.error('Respond to request error:', error);
    return res.status(500).json({ message: 'Failed to respond to request. Server error.' });
  }
};

exports.getPollRequests = async (req, res) => {
  try {
    const { pollId } = req.params;
    const ownerId = req.user.uid;

    const pollDoc = await db.collection('polls').doc(pollId).get();
    if (!pollDoc.exists) {
      return res.status(404).json({ message: 'Poll not found.' });
    }

    if (pollDoc.data().createdBy !== ownerId) {
      return res.status(403).json({ message: 'Unauthorized. Only team owner can view requests.' });
    }

    // Query pending requests
    const querySnapshot = await db.collection('joinRequests')
      .where('pollId', '==', pollId)
      .where('status', '==', 'pending')
      .get();

    const requests = [];
    for (const doc of querySnapshot.docs) {
      const reqData = doc.data();
      
      // Fetch applicant details
      const userDoc = await db.collection('users').doc(reqData.userId).get();
      const userData = userDoc.exists ? userDoc.data() : { name: 'Deleted User', profilePhoto: '' };
      
      requests.push({
        id: doc.id,
        ...reqData,
        userName: userData.name,
        userPhoto: userData.profilePhoto,
        userBio: userData.bio,
        userSkills: userData.skills,
        userExperience: userData.experienceLevel
      });
    }

    return res.status(200).json(requests);
  } catch (error) {
    console.error('Get poll requests error:', error);
    return res.status(500).json({ message: 'Failed to fetch join requests.' });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.uid;
    const querySnapshot = await db.collection('joinRequests')
      .where('userId', '==', userId)
      .get();

    const requests = [];
    for (const doc of querySnapshot.docs) {
      const reqData = doc.data();
      const pollDoc = await db.collection('polls').doc(reqData.pollId).get();
      const pollData = pollDoc.exists ? pollDoc.data() : { title: 'Unknown Project' };

      requests.push({
        id: doc.id,
        ...reqData,
        pollTitle: pollData.title
      });
    }

    return res.status(200).json(requests);
  } catch (error) {
    console.error('Get my requests error:', error);
    return res.status(500).json({ message: 'Failed to fetch your requests.' });
  }
};
