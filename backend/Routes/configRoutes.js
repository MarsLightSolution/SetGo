const express = require('express');
const router = express.Router();
const { generalLimiter } = require('../middlewares/rateLimiter.middleware');
const { getAppConfig } = require('../controller/configController');

// GET /config/app — public runtime config (api url, min version, runtime keys)
router.get('/app', generalLimiter, getAppConfig);

module.exports = router;
