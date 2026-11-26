const express = require("express");
const router = express.Router();
const followController = require("../controller/followercontroller");
const verifyJWT = require("../middlewares/auth.middlewares");

// Follow a user
// SECURITY: login required; the follower is always the logged-in user (was any followerId in the body).
router.post("/follow/:id", verifyJWT, followController.followUser);
router.post("/unfollow/:id", verifyJWT, followController.unfollowUser);
router.get("/check/:followerId/:followingId", followController.checkFollow);
router.get("/:id/followers", followController.getFollowers);
router.get("/:id/following", followController.getFollowing);


module.exports = router;
