const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/join', authMiddleware, requestController.sendJoinRequest);
router.post('/respond/:requestId', authMiddleware, requestController.respondToRequest);
router.get('/poll/:pollId', authMiddleware, requestController.getPollRequests);
router.get('/my-requests', authMiddleware, requestController.getMyRequests);

module.exports = router;
