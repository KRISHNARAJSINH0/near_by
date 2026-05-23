const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/rooms', authMiddleware, chatController.getMyRooms);
router.get('/messages/:roomId', authMiddleware, chatController.getRoomMessages);

module.exports = router;
