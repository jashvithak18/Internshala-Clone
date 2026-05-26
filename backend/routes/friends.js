import express from 'express';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Search for users to add as friends
// @route   GET /api/friends/search
// @access  Private
router.get('/search', protect, async (req, res) => {
  const { query } = req.query;

  try {
    if (!query) {
      return res.json([]);
    }

    // Find users by name or email, excluding the current logged-in user and existing friends
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('name email phone language friends');

    res.json(users);
  } catch (error) {
    console.error('Search Users Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Send a friend request
// @route   POST /api/friends/request/send
// @access  Private
router.post('/request/send', protect, async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user._id;

  try {
    if (senderId.toString() === receiverId) {
      return res.status(400).json({ message: 'You cannot send a friend request to yourself' });
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify not already friends
    if (req.user.friends.includes(receiverId)) {
      return res.status(400).json({ message: 'You are already friends with this user' });
    }

    // Check for existing pending requests (either direction)
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId, status: 'pending' },
        { sender: receiverId, receiver: senderId, status: 'pending' }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'A pending friend request already exists between you' });
    }

    // Create Friend Request in DB
    const newRequest = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
    });

    // Create Notification for Receiver
    const notification = await Notification.create({
      user: receiverId,
      sender: senderId,
      type: 'friend_request',
      message: `${req.user.name} sent you a friend request.`,
    });

    // Populate notification details for Socket.IO
    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name email');

    // Emit Real-Time Socket Event
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId.toString()).emit('new_notification', populatedNotification);
      io.to(receiverId.toString()).emit('new_friend_request', {
        _id: newRequest._id,
        sender: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
        }
      });
    }

    res.status(201).json({ success: true, message: 'Friend request sent successfully', request: newRequest });
  } catch (error) {
    console.error('Send Friend Request Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Accept or reject a friend request
// @route   POST /api/friends/request/respond
// @access  Private
router.post('/request/respond', protect, async (req, res) => {
  const { requestId, action } = req.body; // Action can be 'accept' or 'reject'
  const userId = req.user._id;

  try {
    const friendRequest = await FriendRequest.findById(requestId).populate('sender receiver');

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Verify that current user is the recipient of the request
    if (friendRequest.receiver._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to respond to this request' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'This friend request has already been resolved' });
    }

    if (action === 'accept') {
      friendRequest.status = 'accepted';
      await friendRequest.save();

      // Update friendship links in both user documents
      await User.findByIdAndUpdate(friendRequest.sender._id, {
        $addToSet: { friends: friendRequest.receiver._id }
      });
      await User.findByIdAndUpdate(friendRequest.receiver._id, {
        $addToSet: { friends: friendRequest.sender._id }
      });

      // Create Notification for sender
      const notification = await Notification.create({
        user: friendRequest.sender._id,
        sender: userId,
        type: 'friend_accept',
        message: `${req.user.name} accepted your friend request! You can now share more posts in the community space.`,
      });

      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'name email');

      // Emit sockets
      const io = req.app.get('io');
      if (io) {
        // Emit to sender
        io.to(friendRequest.sender._id.toString()).emit('new_notification', populatedNotification);
        io.to(friendRequest.sender._id.toString()).emit('friend_request_accepted', {
          friend: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email
          }
        });
        
        // Emit to receiver (self - update list immediately)
        io.to(userId.toString()).emit('friend_request_accepted', {
          friend: {
            _id: friendRequest.sender._id,
            name: friendRequest.sender.name,
            email: friendRequest.sender.email
          }
        });
      }

      // Automatically clean up requests between them
      await FriendRequest.findByIdAndDelete(requestId);

      return res.json({ success: true, message: 'Friend request accepted' });
    } 
    
    if (action === 'reject') {
      friendRequest.status = 'rejected';
      await friendRequest.save();
      
      // Clean up request from database
      await FriendRequest.findByIdAndDelete(requestId);

      return res.json({ success: true, message: 'Friend request rejected' });
    }

    res.status(400).json({ message: 'Invalid action parameter' });
  } catch (error) {
    console.error('Respond Friend Request Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    List all friends of the current user
// @route   GET /api/friends/list
// @access  Private
router.get('/list', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'name email phone activePlan language');
    res.json(user.friends);
  } catch (error) {
    console.error('List Friends Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    List all pending requests for the current user
// @route   GET /api/friends/requests
// @access  Private
router.get('/requests', protect, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status: 'pending'
    }).populate('sender', 'name email phone');
    
    res.json(requests);
  } catch (error) {
    console.error('List Requests Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
