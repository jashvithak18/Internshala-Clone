import User from '../models/User.js';

const postLimits = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // Re-fetch the user to get the latest friends and post counts
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const friendCount = user.friends ? user.friends.length : 0;
    
    // Check and apply 24-hour reset logic
    const now = Date.now();
    const lastReset = new Date(user.lastPostReset).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (now - lastReset >= oneDayMs) {
      user.postsCountToday = 0;
      user.lastPostReset = new Date();
      await user.save();
    }

    // Determine dynamic posting limit based on friend count
    let allowedPosts = 0;
    let limitDescription = '';

    if (friendCount === 0) {
      allowedPosts = 0;
      limitDescription = '0 posts per day';
    } else if (friendCount === 1) {
      allowedPosts = 1;
      limitDescription = '1 post per day';
    } else if (friendCount === 2) {
      allowedPosts = 2;
      limitDescription = '2 posts per day';
    } else if (friendCount >= 3 && friendCount <= 10) {
      allowedPosts = friendCount;
      limitDescription = `${friendCount} posts per day`;
    } else {
      allowedPosts = Infinity;
      limitDescription = 'unlimited posts';
    }

    // Check if the daily limit is exceeded
    if (user.postsCountToday >= allowedPosts) {
      if (friendCount === 0) {
        return res.status(403).json({
          message: `Posting is blocked because you have 0 friends. Connecting with a friend allows you to post! Add a friend to unlock community space posting.`,
          friendCount,
          postsCountToday: user.postsCountToday,
          allowedPosts,
          errorType: 'POST_LIMIT_ZERO'
        });
      } else {
        const nextTarget = friendCount + 1;
        const postsNeededForNext = nextTarget <= 10 ? nextTarget : 'unlimited';
        return res.status(403).json({
          message: `You have reached your daily posting limit of ${allowedPosts} posts. You currently have ${friendCount} friends. Add more friends to increase your limit! (Connecting with ${nextTarget} friends unlocks ${postsNeededForNext} posts per day).`,
          friendCount,
          postsCountToday: user.postsCountToday,
          allowedPosts,
          errorType: 'POST_LIMIT_EXCEEDED'
        });
      }
    }

    // Attach computed parameters to req for the controller to use
    req.postLimitData = {
      userDocument: user,
      allowedPosts,
      friendCount
    };

    next();
  } catch (error) {
    console.error('Posting Limit Error:', error.message);
    res.status(500).json({ message: 'Internal server error assessing posting limits' });
  }
};

export default postLimits;
