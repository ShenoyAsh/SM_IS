import express from 'express';
import { signup, login, getMe, logout } from '../controllers/authController.js';
import { getPosts, getPost, createPost, updatePost, deletePost } from '../controllers/postController.js';
import { getComments, createComment, deleteComment } from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authentication Routes
router.post('/auth/signup', signup);
router.post('/auth/login', login);
router.post('/auth/logout', protect, logout);
router.get('/auth/me', protect, getMe);

// Blog Post CRUD Routes
router.get('/posts', getPosts);
router.get('/posts/:id', getPost);
router.post('/posts', protect, createPost);
router.put('/posts/:id', protect, updatePost);
router.delete('/posts/:id', protect, deletePost);

// Comments Routes
router.get('/posts/:postId/comments', getComments);
router.post('/posts/:postId/comments', protect, createComment);
router.delete('/comments/:id', protect, deleteComment);

export default router;
