import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { getMongoConnectionStatus } from '../config/db.js';
import { readData, writeData } from '../config/jsonDb.js';

// @desc    Get all blog posts (with search and pagination)
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 6;
  const search = req.query.search || '';
  const tag = req.query.tag || '';

  const skip = (page - 1) * limit;

  try {
    const isMongo = getMongoConnectionStatus();

    if (isMongo) {
      // Build query object
      let query = {};

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { summary: { $regex: search, $options: 'i' } }
        ];
      }

      if (tag) {
        query.tags = tag;
      }

      // Fetch posts
      const totalPosts = await Post.countDocuments(query);
      const totalPages = Math.ceil(totalPosts / limit);
      
      const posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.status(200).json({
        success: true,
        count: posts.length,
        totalPosts,
        totalPages,
        currentPage: page,
        posts
      });
    } else {
      // JSON File DB fallback
      const data = readData();
      let filteredPosts = [...data.posts];

      // Apply Search Filter
      if (search) {
        const queryLower = search.toLowerCase();
        filteredPosts = filteredPosts.filter(
          p => p.title.toLowerCase().includes(queryLower) || 
               p.content.toLowerCase().includes(queryLower) || 
               p.summary.toLowerCase().includes(queryLower)
        );
      }

      // Apply Tag Filter
      if (tag) {
        filteredPosts = filteredPosts.filter(p => p.tags && p.tags.includes(tag));
      }

      // Sort by newest first
      filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const totalPosts = filteredPosts.length;
      const totalPages = Math.ceil(totalPosts / limit);
      const paginatedPosts = filteredPosts.slice(skip, skip + limit);

      return res.status(200).json({
        success: true,
        count: paginatedPosts.length,
        totalPosts,
        totalPages,
        currentPage: page,
        posts: paginatedPosts
      });
    }
  } catch (error) {
    console.error('Get posts error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving posts' });
  }
};

// @desc    Get a single blog post by ID
// @route   GET /api/posts/:id
// @access  Public
export const getPost = async (req, res) => {
  const { id } = req.params;

  try {
    const isMongo = getMongoConnectionStatus();

    if (isMongo) {
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }
      return res.status(200).json({ success: true, post });
    } else {
      const data = readData();
      const post = data.posts.find(p => p.id === id);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }
      return res.status(200).json({ success: true, post });
    }
  } catch (error) {
    console.error('Get post error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving post' });
  }
};

// @desc    Create a blog post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  const { title, summary, content, tags } = req.body;
  const userId = req.user.id || req.user._id.toString();

  if (!title || !summary || !content) {
    return res.status(400).json({ success: false, message: 'Please provide title, summary, and content' });
  }

  // Calculate read time roughly
  const words = content.trim().split(/\s+/).length;
  const readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;

  const processedTags = tags ? tags.map(t => t.trim().toLowerCase()).filter(t => t !== '') : [];

  try {
    const isMongo = getMongoConnectionStatus();

    if (isMongo) {
      const post = await Post.create({
        title,
        summary,
        content,
        tags: processedTags,
        author: userId,
        authorName: req.user.name,
        authorAvatar: req.user.avatar,
        readTime
      });

      return res.status(201).json({
        success: true,
        message: 'Blog post created successfully!',
        post
      });
    } else {
      const data = readData();
      const newPost = {
        id: 'post_' + Math.random().toString(36).substr(2, 9),
        title,
        summary,
        content,
        tags: processedTags,
        author: userId,
        authorName: req.user.name,
        authorAvatar: req.user.avatar,
        readTime,
        likes: 0,
        createdAt: new Date().toISOString()
      };

      data.posts.push(newPost);
      writeData(data);

      return res.status(201).json({
        success: true,
        message: 'Blog post created successfully (Local DB)!',
        post: newPost
      });
    }
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating blog post' });
  }
};

// @desc    Update a blog post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, summary, content, tags } = req.body;
  const userId = req.user.id || req.user._id.toString();

  try {
    const isMongo = getMongoConnectionStatus();

    if (isMongo) {
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      // Check author permissions
      if (post.author.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized. You can only edit your own posts.' });
      }

      // Update fields
      if (title) post.title = title;
      if (summary) post.summary = summary;
      if (content) {
        post.content = content;
        // Recalculate read time
        const words = content.trim().split(/\s+/).length;
        post.readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;
      }
      if (tags) {
        post.tags = tags.map(t => t.trim().toLowerCase()).filter(t => t !== '');
      }

      await post.save();

      return res.status(200).json({
        success: true,
        message: 'Blog post updated successfully!',
        post
      });
    } else {
      const data = readData();
      const postIndex = data.posts.findIndex(p => p.id === id);
      if (postIndex === -1) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      const post = data.posts[postIndex];

      // Check author permissions
      if (post.author !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized. You can only edit your own posts.' });
      }

      // Update fields
      if (title) post.title = title;
      if (summary) post.summary = summary;
      if (content) {
        post.content = content;
        const words = content.trim().split(/\s+/).length;
        post.readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;
      }
      if (tags) {
        post.tags = tags.map(t => t.trim().toLowerCase()).filter(t => t !== '');
      }

      writeData(data);

      return res.status(200).json({
        success: true,
        message: 'Blog post updated successfully (Local DB)!',
        post
      });
    }
  } catch (error) {
    console.error('Update post error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating post' });
  }
};

// @desc    Delete a blog post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id.toString();

  try {
    const isMongo = getMongoConnectionStatus();

    if (isMongo) {
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      // Check author permissions
      if (post.author.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized. You can only delete your own posts.' });
      }

      // Delete comments first
      await Comment.deleteMany({ post: id });
      // Delete post
      await post.deleteOne();

      return res.status(200).json({
        success: true,
        message: 'Post and its comments deleted successfully.'
      });
    } else {
      const data = readData();
      const postIndex = data.posts.findIndex(p => p.id === id);
      if (postIndex === -1) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      const post = data.posts[postIndex];

      // Check author permissions
      if (post.author !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized. You can only delete your own posts.' });
      }

      // Delete the post
      data.posts.splice(postIndex, 1);
      // Delete comments associated with the post
      data.comments = data.comments.filter(c => c.post !== id);

      writeData(data);

      return res.status(200).json({
        success: true,
        message: 'Post and its comments deleted successfully (Local DB).'
      });
    }
  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting post' });
  }
};
