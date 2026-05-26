import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Send,
  MessageCircle,
  ThumbsUp,
  Image as ImageIcon,
  Video as VideoIcon,
  Search,
  Check,
  X,
  Plus,
  Lock,
  UserPlus,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const Community = () => {
  const { user, apiCall, refreshProfile, posts, setPosts } = useAppContext();
  const { t } = useTranslation();

  // Create post states
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('none');
  const [postError, setPostError] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);

  // Friends & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [searching, setSearching] = useState(false);

  // Comments state
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentsList, setCommentsList] = useState({}); // postId -> comment array
  const [newCommentText, setNewCommentText] = useState('');

  // Initial loads
  useEffect(() => {
    fetchFeed();
    fetchFriends();
    fetchRequests();
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await apiCall('GET', '/api/posts/feed');
      setPosts(res.data);
    } catch (err) {
      console.error('Fetch feed error:', err.message);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await apiCall('GET', '/api/friends/list');
      setFriendsList(res.data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await apiCall('GET', '/api/friends/requests');
      setRequestsList(res.data);
    } catch (err) {
      console.error(err.message);
    }
  };

  // Search friends
  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (q.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await apiCall('GET', `/api/friends/search?query=${q}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setSearching(false);
    }
  };

  // Send request
  const sendFriendRequest = async (receiverId) => {
    try {
      await apiCall('POST', '/api/friends/request/send', { receiverId });
      // Update UI search item status
      setSearchResults((prev) => prev.filter((u) => u._id !== receiverId));
      confetti({ particleCount: 30, spread: 50, colors: ['#6366f1', '#a78bfa'] });
      alert('Friend request sent!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending request');
    }
  };

  // Respond request
  const respondFriendRequest = async (requestId, action) => {
    try {
      await apiCall('POST', '/api/friends/request/respond', { requestId, action });
      // Remove from list
      setRequestsList((prev) => prev.filter((r) => r._id !== requestId));
      fetchFriends();
      refreshProfile();
      if (action === 'accept') {
        confetti({ particleCount: 60, spread: 60 });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error responding to request');
    }
  };

  // Create post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    setPostError('');

    try {
      const res = await apiCall('POST', '/api/posts', {
        content,
        mediaUrl: mediaType !== 'none' ? mediaUrl : '',
        mediaType,
      });

      // Post is added automatically via Socket.IO listener in AppContext, 
      // but we clear local forms and update profile counters immediately!
      setContent('');
      setMediaUrl('');
      setMediaType('none');
      setShowMediaInput(false);
      refreshProfile();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch (err) {
      setPostError(err.response?.data?.message || 'Failed to publish post');
    }
  };

  // Like Toggle
  const handleLike = async (postId) => {
    try {
      await apiCall('POST', `/api/posts/${postId}/like`);
    } catch (err) {
      console.error(err.message);
    }
  };

  // Load comments
  const toggleComments = async (postId) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }

    setActiveCommentPostId(postId);
    if (!commentsList[postId]) {
      try {
        const res = await apiCall('GET', `/api/posts/${postId}/comments`);
        setCommentsList((prev) => ({ ...prev, [postId]: res.data }));
      } catch (err) {
        console.error(err.message);
      }
    }
  };

  // Add Comment
  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const res = await apiCall('POST', `/api/posts/${postId}/comment`, {
        content: newCommentText,
      });

      // Update local comments UI list
      setCommentsList((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.data.comment],
      }));
      setNewCommentText('');
    } catch (err) {
      console.error(err.message);
    }
  };

  // posting limit metrics calculation for UI presentation
  const friendsCount = user?.friends?.length || 0;
  let maxPostsToday = 0;
  if (friendsCount === 1) maxPostsToday = 1;
  else if (friendsCount === 2) maxPostsToday = 2;
  else if (friendsCount >= 3 && friendsCount <= 10) maxPostsToday = friendsCount;
  else if (friendsCount > 10) maxPostsToday = Infinity;

  const postsRemainingToday = maxPostsToday - (user?.postsCountToday || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 page-transition">
      {/* LEFT & CENTER: Post Feed & Write Post */}
      <div className="lg:col-span-2 space-y-6">
        {/* Share box */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-indigo-400 animate-pulse" size={18} />
            <h3 className="text-base font-bold Outfit text-slate-100 uppercase tracking-wider">{t('create_post')}</h3>
          </div>

          {postError && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl mb-4 text-xs text-rose-400">
              {postError}
            </div>
          )}

          <form onSubmit={handleCreatePost} className="space-y-4">
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm focus:outline-none placeholder-slate-500 resize-none text-slate-200"
              placeholder={
                friendsCount === 0
                  ? '⚠️ You have 0 friends. Connecting with a friend allows you to post!'
                  : `What matches your career goals? (Used today: ${user?.postsCountToday || 0}/${maxPostsToday === Infinity ? '∞' : maxPostsToday})`
              }
              disabled={friendsCount === 0}
            />

            {showMediaInput && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-950/40 border border-slate-850 rounded-2xl animate-pulse-slow">
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider">
                    Media URL Link
                  </label>
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full text-xs bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-indigo-300 focus:outline-none"
                    placeholder="https://images.unsplash.com/... or youtube/mp4 URL"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold mb-1 block uppercase tracking-wider">
                    Type
                  </label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value)}
                    className="w-full text-xs bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none"
                  >
                    <option value="none">None</option>
                    <option value="image">📸 Image</option>
                    <option value="video">🎥 Video</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
              <button
                type="button"
                onClick={() => setShowMediaInput(!showMediaInput)}
                disabled={friendsCount === 0}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-1.5 px-3 rounded-lg hover:bg-indigo-600/5 disabled:opacity-50"
              >
                <ImageIcon size={16} />
                <span>Add Photos/Videos</span>
              </button>

              <button
                type="submit"
                disabled={friendsCount === 0 || postsRemainingToday <= 0}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-white ${
                  friendsCount === 0 || postsRemainingToday <= 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 shadow-none'
                    : 'btn-premium'
                }`}
              >
                <Send size={14} />
                {t('publish')}
              </button>
            </div>
          </form>
        </div>

        {/* Community Feed list */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold Outfit text-indigo-300 uppercase tracking-widest flex items-center gap-2">
            <Users size={18} />
            {t('feed')}
          </h2>

          {posts.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center text-slate-400 text-sm">
              No community shares yet. Be the first to share an internship insight or career guide!
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post._id} className="glass-card rounded-3xl p-6 space-y-4">
                  {/* Creator Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-indigo-400 shadow-md">
                        {post.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                          {post.user?.name}
                          {post.user?.isPremium && (
                            <span className="text-[9px] bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold uppercase px-1.5 py-0.5 rounded shadow">
                              Premium
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-sm text-slate-350 leading-relaxed font-sans">
                    {post.content}
                  </p>

                  {/* Post Media Rendering */}
                  {post.mediaUrl && post.mediaType === 'image' && (
                    <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-[350px]">
                      <img src={post.mediaUrl} alt="Community Attachment" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {post.mediaUrl && post.mediaType === 'video' && (
                    <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-[350px] bg-black">
                      <video src={post.mediaUrl} controls className="w-full max-h-[350px] object-contain" />
                    </div>
                  )}

                  {/* Likes & Comments Action bar */}
                  <div className="flex items-center gap-4 border-t border-b border-slate-850 py-3 text-xs">
                    <button
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        post.likes?.includes(user?._id) ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ThumbsUp size={15} />
                      <span>{post.likes?.length || 0} {t('likes')}</span>
                    </button>

                    <button
                      onClick={() => toggleComments(post._id)}
                      className={`flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors ${
                        activeCommentPostId === post._id ? 'text-indigo-400' : ''
                      }`}
                    >
                      <MessageCircle size={15} />
                      <span>{post.commentsCount || 0} {t('comments')}</span>
                    </button>
                  </div>

                  {/* Interactive Comments Drawer */}
                  <AnimatePresence>
                    {activeCommentPostId === post._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden pt-1"
                      >
                        {/* Comments list */}
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                          {commentsList[post._id]?.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic">No comments yet. Share your feedback!</p>
                          ) : (
                            commentsList[post._id]?.map((cmt) => (
                              <div key={cmt._id} className="bg-slate-950/40 border border-slate-850 p-3 rounded-2xl flex items-start gap-2.5">
                                <div className="w-7 h-7 shrink-0 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400">
                                  {cmt.user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-200">{cmt.user?.name}</span>
                                    {cmt.user?.isPremium && (
                                      <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase px-1 rounded">
                                        Pro
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-350 mt-1">{cmt.content}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add Comment Input */}
                        <form onSubmit={(e) => handleAddComment(e, post._id)} className="flex gap-2">
                          <input
                            type="text"
                            required
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            className="flex-grow bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none"
                            placeholder={t('write_comment')}
                          />
                          <button type="submit" className="btn-premium px-4 py-2 rounded-xl text-white">
                            <Send size={12} />
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Friend Limit Rules, Search, Friends Lists */}
      <div className="space-y-6">
        {/* Posting Limits Display */}
        <div className="glass-premium rounded-3xl p-5 border border-indigo-500/10 text-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Lock size={80} />
          </div>
          
          <h3 className="text-sm font-bold Outfit text-indigo-200 mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <Lock size={15} className="text-indigo-400" />
            Posting Allowance Limits
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
              <span className="text-xs text-slate-400 font-medium">Your Friends Count:</span>
              <span className="text-xs font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
                {friendsCount} friends
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
              <span className="text-xs text-slate-400 font-medium">Daily Limit Assigned:</span>
              <span className="text-xs font-bold text-indigo-300">
                {maxPostsToday === 0
                  ? 'Block (0 posts)'
                  : maxPostsToday === Infinity
                  ? 'Unlimited posts'
                  : `${maxPostsToday} posts / day`}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
              <span className="text-xs text-slate-400 font-medium">Posts remaining today:</span>
              <span className={`text-xs font-bold ${postsRemainingToday <= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {maxPostsToday === Infinity ? 'Unlimited' : `${postsRemainingToday} left`}
              </span>
            </div>

            {/* Connection Tips */}
            <div className="text-[10px] text-slate-400 bg-slate-950/20 p-3 rounded-xl border border-slate-850/50 space-y-1">
              <p className="font-semibold text-slate-300 uppercase tracking-wider mb-1">Posting unlocks legend:</p>
              <p>• 0 friends ➜ Blocked (0 posts/day)</p>
              <p>• 1 friend ➜ 1 post/day</p>
              <p>• 2 friends ➜ 2 posts/day</p>
              <p>• 3–10 friends ➜ posts equal friend count</p>
              <p>• &gt;10 friends ➜ Unlimited postings</p>
              {friendsCount <= 10 && (
                <p className="text-indigo-400 font-bold mt-2 animate-pulse-slow">
                  💡 Tip: Connect with {friendsCount === 0 ? '1 friend' : `${friendsCount + 1} friends`} to unlock more posting privileges!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Friend Requests panel */}
        {requestsList.length > 0 && (
          <div className="glass-card rounded-3xl p-5 border border-amber-500/10">
            <h3 className="text-xs font-bold Outfit text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users size={14} />
              {t('friend_requests')} ({requestsList.length})
            </h3>
            <div className="space-y-3">
              {requestsList.map((req) => (
                <div key={req._id} className="bg-slate-950/40 border border-slate-850 p-3 rounded-2xl flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-200">{req.sender?.name}</p>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">{req.sender?.phone}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => respondFriendRequest(req._id, 'accept')}
                      className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-1.5 rounded-lg hover:bg-emerald-500/30 transition-colors"
                      title="Accept"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => respondFriendRequest(req._id, 'reject')}
                      className="bg-rose-500/20 border border-rose-500/30 text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/30 transition-colors"
                      title="Reject"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connect & Search Drawer */}
        <div className="glass-card rounded-3xl p-5">
          <h3 className="text-xs font-bold Outfit text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <UserPlus size={14} className="text-indigo-400" />
            Connect & Add Friends
          </h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
              placeholder={t('search_friends')}
            />
          </div>

          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {searching ? (
              <p className="text-[11px] text-slate-500 italic text-center">Searching database...</p>
            ) : searchResults.length === 0 && searchQuery ? (
              <p className="text-[11px] text-slate-500 text-center">No matches found.</p>
            ) : (
              searchResults.map((usr) => (
                <div key={usr._id} className="bg-slate-950/20 border border-slate-850 p-2.5 rounded-2xl flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-200">{usr.name}</p>
                    <p className="text-[9px] text-slate-500">{usr.email}</p>
                  </div>
                  <button
                    onClick={() => sendFriendRequest(usr._id)}
                    className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Friends Catalog */}
        <div className="glass-card rounded-3xl p-5">
          <h3 className="text-xs font-bold Outfit text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users size={14} className="text-indigo-400" />
            {t('friends')} ({friendsList.length})
          </h3>

          {friendsList.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic text-center py-4">No active connections. Search and add friends to activate community postings!</p>
          ) : (
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {friendsList.map((f) => (
                <div key={f._id} className="bg-slate-950/40 border border-slate-850/60 p-2.5 rounded-2xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0">
                    {f.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{f.name}</p>
                    <p className="text-[9px] text-slate-400 truncate">{f.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;
