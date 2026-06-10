import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  summary: {
    type: String,
    required: [true, 'Please add a short summary'],
    maxlength: [250, 'Summary cannot be more than 250 characters']
  },
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  tags: {
    type: [String],
    default: []
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorAvatar: {
    type: String
  },
  readTime: {
    type: String,
    default: '3 min read'
  },
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Post', PostSchema);
