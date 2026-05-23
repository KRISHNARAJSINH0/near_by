const { db } = require('../config/firebase');

exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.uid;

    const querySnapshot = await db.collection('notifications')
      .where('recipient', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const notifRef = db.collection('notifications').doc(id);
    const notifDoc = await notifRef.get();

    if (!notifDoc.exists) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    if (notifDoc.data().recipient !== userId) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    await notifRef.update({ read: true });

    return res.status(200).json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ message: 'Failed to update notification.' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.uid;

    const querySnapshot = await db.collection('notifications')
      .where('recipient', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = db.batch ? db.batch() : null;

    if (batch) {
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
    } else {
      // In-memory or batch fallback
      for (const doc of querySnapshot.docs) {
        await db.collection('notifications').doc(doc.id).update({ read: true });
      }
    }

    return res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({ message: 'Failed to update notifications.' });
  }
};
