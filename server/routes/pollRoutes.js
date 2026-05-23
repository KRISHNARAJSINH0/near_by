const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, pollController.createPoll);
router.get('/nearby', authMiddleware, pollController.getNearbyPolls);
router.get('/:id', authMiddleware, pollController.getPollDetails);

module.exports = router;
