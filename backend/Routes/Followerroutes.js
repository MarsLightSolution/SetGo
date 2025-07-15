const express = require("express");
const router = express.Router();
const followController = require("../controller/followercontroller");

// Follow a user
router.post("/follow/:id", followController.followUser);
router.post("/unfollow/:id", followController.unfollowUser);
router.get("/check/:followerId/:followingId", followController.checkFollow);
router.get("/:id/followers", followController.getFollowers);
router.get("/:id/following", followController.getFollowing);


module.exports = router;
