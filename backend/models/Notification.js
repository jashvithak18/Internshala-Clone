import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // Recipient
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Who triggered it (optional)
  },
  type: {
    type: String,
    enum: ['friend_request', 'friend_accept', 'like', 'comment', 'system', 'security'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
