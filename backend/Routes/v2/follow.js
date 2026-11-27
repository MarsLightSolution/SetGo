// /api/v2/follow — the follower is always the logged-in user; follower lists without emails.
const express = require("express");
const verifyJWT = require("../../middlewares/auth.middlewares");
const { asSelf, isObjectId } = require("../../middlewares/v2Guards.middleware");
const F = require("../../controller/followercontroller");
const { getFollowers, getFollowing } = require("../../controller/v2/account.controller");

const router = express.Router();
const validTarget = (req, res, next) =>
  isObjectId(req.params.id) ? next() : res.status(400).json({ message: "Invalid user ID" });

router.post("/:id/follow", verifyJWT, validTarget, asSelf("followerId"), F.followUser);
router.post("/:id/unfollow", verifyJWT, validTarget, asSelf("followerId"), F.unfollowUser);
router.get("/check/:followerId/:followingId", F.checkFollow);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);

module.exports = router;
