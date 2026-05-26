import express from 'express';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import postLimits from '../middleware/postLimits.js';

const router = express.Router();

// @desc    Create a new post in public space
// @route   POST /api/posts
// @access  Private
router.post('/', protect, postLimits, async (req, res) => {
  const { content, mediaUrl, mediaType } = req.body;
  const userId = req.user._id;

  try {
    if (!content) {
      return res.status(400).json({ message: 'Content is required to publish a post' });
    }

    // Create the post in DB
    const post = await Post.create({
      user: userId,
      content,
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || 'none',
    });

    // Populate user details for immediate client presentation
    const populatedPost = await Post.findById(post._id).populate('user', 'name email phone language friends');

    // Increment post counter on the user
    // req.postLimitData has the re-fetched Mongoose User document from postLimits middleware
    const userDoc = req.postLimitData.userDocument;
    userDoc.postsCountToday += 1;
    await userDoc.save();

    // Broadcast new post to all active clients via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('new_post', populatedPost);
    }

    res.status(201).json({
      success: true,
      message: 'Post published successfully!',
      post: populatedPost,
      postsCountToday: userDoc.postsCountToday,
      allowedPosts: req.postLimitData.allowedPosts,
    });
  } catch (error) {
    console.error('Publish Post Error:', error.message);
    res.status(500).json({ message: 'Server error publishing post' });
  }
});

// @desc    Retrieve all public space feed posts
// @route   GET /api/posts/feed
// @access  Private
router.get('/feed', protect, async (req, res) => {
  try {
    const feed = await Post.find()
      .populate('user', 'name email isPremium')
      .sort({ createdAt: -1 });
    
    res.json(feed);
  } catch (error) {
    console.error('Fetch Feed Error:', error.message);
    res.status(500).json({ message: 'Server error fetching community feed' });
  }
});

// @desc    Like or unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user._id;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(userId);
    let action = 'liked';

    if (likeIndex > -1) {
      // Already liked, so unlike
      post.likes.splice(likeIndex, 1);
      action = 'unliked';
    } else {
      // Not liked, add like
      post.likes.push(userId);
      
      // Create notification for post owner (if it's not the owner themselves)
      if (post.user.toString() !== userId.toString()) {
        const notification = await Notification.create({
          user: post.user,
          sender: userId,
          type: 'like',
          message: `${req.user.name} liked your post.`,
        });

        const populatedNotification = await Notification.findById(notification._id)
          .populate('sender', 'name email');

        const io = req.app.get('io');
        if (io) {
          io.to(post.user.toString()).emit('new_notification', populatedNotification);
        }
      }
    }

    await post.save();

    // Broadcast like change in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('post_liked', { postId, likes: post.likes, userId, action });
    }

    res.json({ success: true, likes: post.likes, action });
  } catch (error) {
    console.error('Like Post Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Comment on a post
// @route   POST /api/posts/:id/comment
// @access  Private
router.post('/:id/comment', protect, async (req, res) => {
  const postId = req.params.id;
  const { content } = req.body;
  const userId = req.user._id;

  try {
    if (!content) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Create the comment
    const comment = await Comment.create({
      post: postId,
      user: userId,
      content,
    });

    // Increment comment counters on Post
    post.commentsCount += 1;
    await post.save();

    // Populate comment details for live delivery
    const populatedComment = await Comment.findById(comment._id).populate('user', 'name email isPremium');

    // Create notification for post owner (if not commenting on self)
    if (post.user.toString() !== userId.toString()) {
      const notification = await Notification.create({
        user: post.user,
        sender: userId,
        type: 'comment',
        message: `${req.user.name} commented on your post: "${content.substring(0, 30)}..."`,
      });

      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'name email');

      const io = req.app.get('io');
      if (io) {
        io.to(post.user.toString()).emit('new_notification', populatedNotification);
      }
    }

    // Broadcast comment in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('new_comment', { postId, comment: populatedComment });
    }

    res.status(201).json({ success: true, comment: populatedComment });
  } catch (error) {
    console.error('Comment Post Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Fetch comments for a specific post
// @route   GET /api/posts/:id/comments
// @access  Private
router.get('/:id/comments', protect, async (req, res) => {
  const postId = req.params.id;

  try {
    const comments = await Comment.find({ post: postId })
      .populate('user', 'name email isPremium')
      .sort({ createdAt: 1 });
    
    res.json(comments);
  } catch (error) {
    console.error('Fetch Comments Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
