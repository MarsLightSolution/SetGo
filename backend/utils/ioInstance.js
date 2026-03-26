/**
 * ioInstance.js
 * Stores the Socket.IO server instance so any controller can emit
 * targeted notifications without needing the io object passed in.
 *
 * Usage (emit):
 *   const { emitToUser } = require('../utils/ioInstance');
 *   emitToUser(userId, 'notification', { ... });
 */

let _io = null;

const setIO = (io) => {
  _io = io;
};

const getIO = () => _io;

/**
 * Emit an event to a specific user's personal socket room.
 * @param {string} userId  – the user's MongoDB _id (or email if that's what they joined with)
 * @param {string} event   – socket event name
 * @param {object} data    – payload
 */
const emitToUser = (userId, event, data) => {
  if (_io && userId) {
    _io.to(`user_${userId}`).emit(event, data);
  }
};

module.exports = { setIO, getIO, emitToUser };
