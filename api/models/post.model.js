import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      default:
        'https://www.hostinger.com/tutorials/wp-content/uploads/sites/2/2021/09/how-to-write-a-blog-post.png',
    },
    category: {
      type: String,
      default: '',
    },
    views:{
      type: Number,
      default:0
    },
    viewers: { 
      type: [String], 
      default: [] 
    },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    comments:{
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Comment',
    },
    hidden: { type: Boolean, default: false },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);

export default Post;
