// /api/v2 — secured versions of existing endpoints. The original routes and controllers are
// unchanged; clients switch to these paths. Every v2 route that acts for a person requires
// login and takes that person from the token, never from ids in the URL/body/query.
const express = require("express");

const router = express.Router();

router.use("/orders", require("./orders"));
router.use("/reviews", require("./reviews"));
router.use("/users", require("./users"));
router.use("/chat", require("./chat"));
router.use("/products", require("./products"));
router.use("/profile", require("./profile"));
router.use("/otp", require("./otp"));
router.use("/follow", require("./follow"));
router.use("/auth", require("./auth"));
router.use("/ads", require("./ads"));
router.use("/logs", require("./logs"));
router.use("/notifications", require("./notifications"));
router.use("/redis", require("./redis"));
router.use("/chatbot", require("./chatbot"));

module.exports = router;
