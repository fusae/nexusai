const express = require('express');
const router = express.Router();

router.post('/', (req, res) => res.json({ success: true }));
router.get('/conversations', (req, res) => res.json({ success: true, conversations: [] }));
router.get('/:userId', (req, res) => res.json({ success: true, messages: [] }));

module.exports = router;
