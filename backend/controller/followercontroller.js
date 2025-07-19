const User = require("../models/user");

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const followerId = req.body.followerId;
    const followingId = req.params.id;

    if (followerId === followingId)
      return res.status(400).json({ message: "You can't follow yourself" });

    const follower = await User.findById(followerId);
    const following = await User.findById(followingId);

    if (!follower || !following)
      return res.status(404).json({ message: "User not found" });

    // Avoid duplicates
    if (!follower.following.includes(followingId)) {
      follower.following.push(followingId);
      await follower.save();
    }

    if (!following.followers.includes(followerId)) {
      following.followers.push(followerId);
      await following.save();
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const followerId = req.body.followerId;
    const followingId = req.params.id;

    const follower = await User.findById(followerId);
    const following = await User.findById(followingId);

    if (!follower || !following)
      return res.status(404).json({ message: "User not found" });

    follower.following = follower.following.filter(
      (id) => id.toString() !== followingId
    );
    following.followers = following.followers.filter(
      (id) => id.toString() !== followerId
    );

    await follower.save();
    await following.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check if following
exports.checkFollow = async (req, res) => {
  try {
    const { followerId, followingId } = req.params;

    const user = await User.findById(followerId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const isFollowing = user.following.includes(followingId);

    res.status(200).json({ isFollowing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get followers of a user
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("followers", "name");
    res.status(200).json({ followers: user.followers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get following list of a user
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("following", "name");
    res.status(200).json({ following: user.following });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
