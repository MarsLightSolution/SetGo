const User = require("../models/user");
const Conversation = require("../models/Conversation");
const Message = require("../models/message");
// Connect user by username
exports.connectUser = async (req, res) => {
  const { username, displayName } = req.body;
  if (!username) return res.json({ success: false, message: "Username is required" });

  const user = await User.findOne({ username });
  if (!user) return res.json({ success: false, message: "User not found. Please register first." });

  user.isOnline = true;
  user.lastSeen = new Date();
  if (displayName) user.chatDisplayName = displayName;
  await user.save();

  res.json({
    success: true,
    user: {
      userId: user.username,
      userName: user.chatDisplayName || user.profileName || user.username,
      email: user.email,
      _id: user._id,
    },
  });
};

exports.getUsers = async (req, res) => {
  const users = await User.find({}, "username profileName chatDisplayName isOnline lastSeen email");
  const chatUsers = users.map(u => ({
    userId: u.username,
    userName: u.chatDisplayName || u.profileName || u.username,
    email: u.email,
    isOnline: u.isOnline,
    lastSeen: u.lastSeen,
  }));
  res.json({ success: true, users: chatUsers });
};

exports.getUserByUsername = async (req, res) => {
  const user = await User.findOne(
    { username: req.params.username },
    "username profileName chatDisplayName email isOnline lastSeen"
  );
  if (!user) return res.json({ success: false, message: "User not found" });

  res.json({
    success: true,
    user: {
      userId: user.username,
      userName: user.chatDisplayName || user.profileName || user.username,
      email: user.email,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    },
  });
};

exports.getConversations = async (req, res) => {
  const { username } = req.params;
  const conversations = await Conversation.find({ "participants.userId": username }).sort({ lastMessageTime: -1 });
  res.json({ success: true, conversations });
};

exports.createConversation = async (req, res) => {
  const { participants } = req.body;
  if (!participants || participants.length !== 2)
    return res.json({ success: false, message: "Two participants required" });

  let conversation = await Conversation.findOne({
    $and: [
      { "participants.userId": participants[0] },
      { "participants.userId": participants[1] },
    ],
  });

  if (!conversation) {
    const [user1, user2] = await Promise.all([
      User.findOne({ username: participants[0] }),
      User.findOne({ username: participants[1] }),
    ]);
    if (!user1 || !user2) return res.json({ success: false, message: "One or both users not found" });

    conversation = await Conversation.create({
      participants: [
        {
          userId: user1.username,
          userName: user1.chatDisplayName || user1.profileName || user1.username,
        },
        {
          userId: user2.username,
          userName: user2.chatDisplayName || user2.profileName || user2.username,
        },
      ],
    });
  }

  res.json({ success: true, conversation });
};

exports.getMessages = async (req, res) => {
  const messages = await Message.find({ conversationId: req.params.conversationId })
    .sort({ timestamp: 1 })
    .limit(100);
  res.json({ success: true, messages });
};

exports.sendMessage = async (req, res) => {
  const { conversationId, senderId, text } = req.body;
  if (!conversationId || !senderId || !text)
    return res.json({ success: false, message: "Missing required fields" });

  const sender = await User.findOne({ username: senderId });
  if (!sender) return res.json({ success: false, message: "Sender not found" });

  const message = await Message.create({
    conversationId,
    senderId,
    senderName: sender.chatDisplayName || sender.profileName || sender.username,
    text,
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: text,
    lastMessageTime: new Date(),
  });

  const io = req.app.get("io");
  io.to(conversationId).emit("new-message", { conversationId, message });

  res.json({ success: true, message });
};
