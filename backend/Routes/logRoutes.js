const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const verifyToken = require('../middlewares/auth.middlewares');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { reportError, getErrors, resolveError } = require('../controller/errorLogController');

const ERROR_LOG_PATH = path.join(__dirname, '../logs/error.log');

// GET /api/logs/error
// Query params: lines (default 100), since (ISO date string)
router.get('/error', verifyToken, asyncHandler(async (req, res) => {
  if (!fs.existsSync(ERROR_LOG_PATH)) {
    return res.status(200).json(new ApiResponse(200, { entries: [] }, 'No error log found'));
  }

  const maxLines = Math.min(parseInt(req.query.lines) || 100, 1000);
  const since = req.query.since ? new Date(req.query.since) : null;

  const raw = fs.readFileSync(ERROR_LOG_PATH, 'utf-8');
  const lines = raw.trim().split('\n').filter(Boolean);

  const entries = lines
    .slice(-maxLines)
    .map((line) => {
      const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\]: (.+)$/);
      if (!match) return { raw: line };
      return { timestamp: match[1], level: match[2], message: match[3] };
    })
    .filter((entry) => {
      if (!since || !entry.timestamp) return true;
      return new Date(entry.timestamp) >= since;
    });

  res.status(200).json(new ApiResponse(200, { total: entries.length, entries }, 'Error logs fetched'));
}));

// POST /api/logs/error — receive client-side error reports from mobile app (no auth)
router.post('/error', reportError);

// GET /api/logs/error/db — fetch MongoDB error logs (auth required)
router.get('/error/db', verifyToken, getErrors);

// PATCH /api/logs/error/:id/resolve — mark error resolved (auth required)
router.patch('/error/:id/resolve', verifyToken, resolveError);

module.exports = router;
