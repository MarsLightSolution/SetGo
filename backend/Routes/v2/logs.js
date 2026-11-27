// /api/v2/logs — reading/resolving logs is admin only; reporting stays public but rate limited.
const express = require("express");
const verifyJWT = require("../../middlewares/auth.middlewares");
const { adminOnly, limiter } = require("../../middlewares/v2Guards.middleware");
const { reportError, getErrors, resolveError } = require("../../controller/errorLogController");
const { readErrorLogFile } = require("../../controller/v2/admin.controller");

const router = express.Router();

router.post("/error", limiter(60), reportError);
router.get("/error", verifyJWT, adminOnly, readErrorLogFile);
router.get("/error/db", verifyJWT, adminOnly, getErrors);
router.patch("/error/:id/resolve", verifyJWT, adminOnly, resolveError);

module.exports = router;
