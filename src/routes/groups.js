const express = require('express');
const router = express.Router();

router.post('/', (req, res) => res.json({ success: true }));
router.get('/', (req, res) => res.json({ success: true, groups: [] }));
router.post('/:id/join', (req, res) => res.json({ success: true }));
router.post('/:id/leave', (req, res) => res.json({ success: true }));

module.exports = router;
