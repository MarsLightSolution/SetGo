const User = require("../models/user");
const logger = require("../utils/logger"); // Import the logger

// Follow a user
exports.followUser = async (req, res) => {
  const followerId = req.body.followerId;
  const followingId = req.params.id;
  logger.info(`[FollowUser] Request from follower: ${followerId} to follow: ${followingId}`);

  try {
    if (followerId === followingId) {
      logger.warn(`[FollowUser] Validation failed: User ${followerId} attempted to follow themselves.`);
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const follower = await User.findById(followerId);
    const following = await User.findById(followingId);

    if (!follower || !following) {
      logger.warn(`[FollowUser] User not found. Follower exists: ${!!follower}, Following exists: ${!!following}`);
      return res.status(404).json({ message: "User not found" });
    }

    // Avoid duplicates
    if (!follower.following.includes(followingId)) {
      follower.following.push(followingId);
      await follower.save();
    }

    if (!following.followers.includes(followerId)) {
      following.followers.push(followerId);
      await following.save();
    }
    
    logger.info(`[FollowUser] Successfully processed follow request from ${followerId} to ${followingId}`);
    return res.status(200).json({ success: true, message: "User followed successfully" });
  } catch (err) {
    logger.error(`[FollowUser] Error: ${err.stack}`);
    res.status(500).json({ message: "An error occurred while trying to follow the user." });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  const followerId = req.body.followerId;
  const followingId = req.params.id;
  logger.info(`[UnfollowUser] Request from follower: ${followerId} to unfollow: ${followingId}`);

  try {
    const follower = await User.findById(followerId);
    const following = await User.findById(followingId);

    if (!follower || !following) {
      logger.warn(`[UnfollowUser] User not found. Follower exists: ${!!follower}, Following exists: ${!!following}`);
      return res.status(404).json({ message: "User not found" });
    }

    follower.following = follower.following.filter(
      (id) => id.toString() !== followingId
    );
    following.followers = following.followers.filter(
      (id) => id.toString() !== followerId
    );

    await follower.save();
    await following.save();
    
    logger.info(`[UnfollowUser] Successfully processed unfollow request from ${followerId} to ${followingId}`);
    return res.status(200).json({ success: true, message: "User unfollowed successfully" });
  } catch (err) {
    logger.error(`[UnfollowUser] Error: ${err.stack}`);
    res.status(500).json({ message: "An error occurred while trying to unfollow the user." });
  }
};

// Check if following
exports.checkFollow = async (req, res) => {
  const { followerId, followingId } = req.params;
  logger.info(`[CheckFollow] Request to check if ${followerId} follows ${followingId}`);
  try {
    const user = await User.findById(followerId);

    if (!user) {
      logger.warn(`[CheckFollow] User not found: ${followerId}`);
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = user.following.includes(followingId);
    
    logger.info(`[CheckFollow] Check complete for ${followerId}. Is following: ${isFollowing}`);
    res.status(200).json({ isFollowing });
  } catch (err) {
    logger.error(`[CheckFollow] Error: ${err.stack}`);
    res.status(500).json({ message: "An error occurred during follow check." });
  }
};

// Get followers of a user
exports.getFollowers = async (req, res) => {
  const { id } = req.params;
  logger.info(`[GetFollowers] Request to get followers for user: ${id}`);
  try {
    const user = await User.findById(id).populate("followers", "username email"); // Populate with useful fields
    if (!user) {
        logger.warn(`[GetFollowers] User not found: ${id}`);
        return res.status(404).json({ message: "User not found" });
    }
    
    logger.info(`[GetFollowers] Successfully fetched ${user.followers.length} followers for user: ${id}`);
    res.status(200).json({ followers: user.followers });
  } catch (err) {
    logger.error(`[GetFollowers] Error: ${err.stack}`);
    res.status(500).json({ message: "An error occurred while fetching followers." });
  }
};

// Get following list of a user
exports.getFollowing = async (req, res) => {
  const { id } = req.params;
  logger.info(`[GetFollowing] Request to get following list for user: ${id}`);
  try {
    const user = await User.findById(id).populate("following", "username email"); // Populate with useful fields
    if (!user) {
        logger.warn(`[GetFollowing] User not found: ${id}`);
        return res.status(404).json({ message: "User not found" });
    }
    
    logger.info(`[GetFollowing] Successfully fetched ${user.following.length} users for user: ${id}`);
    res.status(200).json({ following: user.following });
  } catch (err) {
    logger.error(`[GetFollowing] Error: ${err.stack}`);
    res.status(500).json({ message: "An error occurred while fetching the following list." });
  }
};
