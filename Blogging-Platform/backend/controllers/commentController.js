import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import { getMongoConnectionStatus } from '../config/db.js';
import { readData, writeData } from '../config/jsonDb.js';

// @desc    Get comments for a specific post
// @route   GET /api/posts/:postId/comments
// @access  Public
export const getComments = async (req, res) => {
  const { postId } = req.params;

  try {
    const isMongo = getMongoConnectionStatus();

    if (isMongo) {
      const comments = await Comment.find({ post: postId }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: comments.length, comments });
    } else {
      const data = readData();
      const comments = data.comments
        .filter(c => c.post === postId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.status(200).json({ success: true, count: comments.length, comments });
    }
  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving comments' });
  }
};

// @desc    Create a comment on a post
// @route   POST /api/posts/:postId/comments
// @access  Private
export const createComment = async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user.id || req.user._id.toString();

  if (!content) {
    return res.status(400).json({ success: false, message: 'Comment content is required' });
  }

  try {
    const isMongo = getMongoConnectionStatus();

    if (isMongo) {
      // Check if post exists
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      const comment = await Comment.create({
        post: postId,
        author: userId,
        authorName: req.user.name,
        authorAvatar: req.user.avatar,
        content
      });

      return res.status(201).json({
        success: true,
        message: 'Comment added successfully!',
        comment
      });
    } else {
      const data = readData();
      const post = data.posts.find(p => p.id === postId);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      const newComment = {
        id: 'comment_' + Math.random().toString(36).substr(2, 9),
        post: postId,
        author: userId,
        authorName: req.user.name,
        authorAvatar: req.user.avatar,
        content,
        createdAt: new Date().toISOString()
      };

      data.comments.push(newComment);
      writeData(data);

      return res.status(201).json({
        success: true,
        message: 'Comment added successfully (Local DB)!',
        comment: newComment
      });
    }
  } catch (error) {
    console.error('Create comment error:', error);
    return res.status(500).json({ success: false, message: 'Server error adding comment' });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id.toString();

  try {
    const isMongo = getMongoConnectionStatus();

    if (isMongo) {
      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({ success: false, message: 'Comment not found' });
      }

      // Fetch the parent post to check if current user is the post owner
      const post = await Post.findById(comment.post);
      const isPostOwner = post && post.author.toString() === userId;
      const isCommentOwner = comment.author && comment.author.toString() === userId;

      // Only comment author OR post owner can delete the comment
      if (!isCommentOwner && !isPostOwner) {
        return res.status(403).json({ success: false, message: 'Unauthorized. You cannot delete this comment.' });
      }

      await comment.deleteOne();

      return res.status(200).json({
        success: true,
        message: 'Comment deleted successfully.'
      });
    } else {
      const data = readData();
      const commentIndex = data.comments.findIndex(c => c.id === id);
      if (commentIndex === -1) {
        return res.status(404).json({ success: false, message: 'Comment not found' });
      }

      const comment = data.comments[commentIndex];
      const post = data.posts.find(p => p.id === comment.post);
      const isPostOwner = post && post.author === userId;
      const isCommentOwner = comment.author === userId;

      if (!isCommentOwner && !isPostOwner) {
        return res.status(403).json({ success: false, message: 'Unauthorized. You cannot delete this comment.' });
      }

      data.comments.splice(commentIndex, 1);
      writeData(data);

      return res.status(200).json({
        success: true,
        message: 'Comment deleted successfully (Local DB).'
      });
    }
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting comment' });
  }
};
