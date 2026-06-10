import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
    required: true
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false // Allow guest comments if necessary, but we can default to authenticated users
  },
  authorName: {
    type: String,
    required: [true, 'Please add an author name']
  },
  authorAvatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'
  },
  content: {
    type: String,
    required: [true, 'Please add comment content'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Comment', CommentSchema);
