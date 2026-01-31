const express = require('express');
const router = express.Router();

router.post('/:id/request', (req, res) => res.json({ success: true }));
router.post('/:id/accept', (req, res) => res.json({ success: true }));
router.delete('/:id', (req, res) => res.json({ success: true }));
router.get('/', (req, res) => res.json({ success: true, friends: [] }));

module.exports = router;
