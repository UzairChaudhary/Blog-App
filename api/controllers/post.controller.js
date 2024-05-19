import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';
import { errorHandler } from '../utils/error.js';
import getClientIp from '../utils/getClientIp.js'; // Utility function to get client IP address
export const create = async (req, res, next) => {
  
  if (!req.user.isAdmin) {
    return next(errorHandler(403, 'You are not allowed to create a post'));
  }
  if (!req.body.title || !req.body.content) {
    return next(errorHandler(400, 'Please provide all required fields'));
  }
  const slug = req.body.title
    .split(' ')
    .join('-')
    .toLowerCase()
    .replace(/[^a-zA-Z0-9-]/g, '');
  const newPost = new Post({
    ...req.body,
    slug,
    userId: req.user._id,
  });
  try {
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    next(error);
  }
};

export const getposts = async (req, res, next) => {
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.sort === 'asc' ? 1 : -1;

    let posts;
    if (req.query.slug) {
      // Find the post by slug and increment its view count
      posts = await Post.find({ slug: req.query.slug});
      if (posts.length > 0) {
        const post = posts[0];
        
        const clientIp = getClientIp(req);
        // Increment view count only if the IP address is not already in the viewers array
        if (!post.viewers.includes(clientIp)) {
          post.views += 1;
          post.viewers.push(clientIp);
          await post.save();
        }
      }
    }
    else{
     posts = await Post.find({
      
      ...(req.query.userId && { userId: req.query.userId }),
      ...(req.query.category && { category: req.query.category }),
      ...(req.query.slug && { slug: req.query.slug }),
      ...(req.query.postId && { _id: req.query.postId }),
      ...(req.query.searchTerm && {
        $or: [
          { title: { $regex: req.query.searchTerm, $options: 'i' } },
          { content: { $regex: req.query.searchTerm, $options: 'i' } },
        ],
      }),
    })
      .sort({ updatedAt: sortDirection })
      .skip(startIndex)
      .limit(limit);
  }
    const totalPosts = await Post.countDocuments();

    const now = new Date();

    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );

    const lastMonthPosts = await Post.countDocuments({
      createdAt: { $gte: oneMonthAgo },
      
    });

        // Calculate total likes
    const totalLikes = await Post.aggregate([
      {
        $group: {
          _id: null,
          totalLikes: { $sum: "$likes" },
        },
      },
    ]);

    // Calculate total likes in the last month
    const totalLikesLastMonth = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: oneMonthAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: "$likes" },
        },
      },
    ]);

    res.status(200).json({
      posts,
      totalPosts,
      lastMonthPosts,
      totalLikes: totalLikes[0]?.totalLikes || 0,
      totalLikesLastMonth: totalLikesLastMonth[0]?.totalLikes || 0,
    });
  } catch (error) {
    next(error);
  }
};

export const deletepost = async (req, res, next) => {
  if (!req.user.isAdmin || req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'You are not allowed to delete this post'));
  }
  try {
    await Post.findByIdAndDelete(req.params.postId);
    // Delete all comments associated with the post
    await Comment.deleteMany({ postId: req.params.postId });

    res.status(200).json('The post has been deleted');
  } catch (error) {
    next(error);
  }
};

export const updatepost = async (req, res, next) => {
  if (!req.user.isAdmin || req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'You are not allowed to update this post'));
  }
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      {
        $set: {
          title: req.body.title,
          content: req.body.content,
          category: req.body.category,
          image: req.body.image,
        },
      },
      { new: true }
    );
    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};


export const likePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id; // Assuming user ID is available in req.user
    
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.likedBy.includes(userId)) {
      // Unlike the post
      post.likes -= 1;
      post.likedBy = post.likedBy.filter(id => id !== userId);
    } else {
      // Like the post
      post.likes += 1;
      post.likedBy.push(userId);
    }

    await post.save();

    res.status(200).json({ likes: post.likes, likedByUser: post.likedBy.includes(userId) });
  } catch (error) {
    next(error);
  }
};

export const getPostLikeStatus = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id; // Assuming user ID is available in req.user

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ likedByUser: post.likedBy.includes(userId) });
  } catch (error) {
    next(error);
  }
};

export const toggleHidePost = async (req, res, next) => {
  if (!req.user.isAdmin) {
    
    return next(errorHandler(403, 'You are not allowed to hide/unhide this post'));
  }
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.hidden = !post.hidden;
    await post.save();

    res.status(200).json({ hidden: post.hidden });
  } catch (error) {
    next(error);
  }
};



export const getGraphData = async (req, res, next) => {
  if (!req.user.isAdmin) {
    
    return next(errorHandler(403, 'You are not allowed to get statistics'));
  }
  try {
    const now = new Date();

    // Helper function to create date boundaries
    const createDateBoundaries = (interval) => {
      if (interval === 'daily') {
        return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30), end: now };
      } else if (interval === 'monthly') {
        return { start: new Date(now.getFullYear(), now.getMonth() - 12, now.getDate()), end: now };
      } else if (interval === 'yearly') {
        return { start: new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()), end: now };
      }
      return { start: now, end: now };
    };
        // Aggregate Blogs Creation Data and Comments Data
        const aggregateData = async (model,interval) => {
          const { start, end } = createDateBoundaries(interval);
          const groupByFormat = interval === 'daily' ? '%Y-%m-%d' : interval === 'monthly' ? '%Y-%m' : '%Y';
    
          return model.aggregate([
            {
              $match: {
                createdAt: {
                  $gte: start,
                  $lte: end,
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: groupByFormat, date: '$createdAt' },
                },
                count: { $sum: 1 },
              },
            },
            {
              $sort: { _id: 1 },
            },
          ]);
        };

    // Aggregate Likes data based on the interval
    const aggregateLikesData = async (field, interval) => {
      const { start, end } = createDateBoundaries(interval);
      const groupByFormat = interval === 'daily' ? '%Y-%m-%d' : interval === 'monthly' ? '%Y-%m' : '%Y';

      return Post.aggregate([
        {
          $match: {
            createdAt: {
              $gte: start,
              $lte: end,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: groupByFormat, date: '$createdAt' },
            },
            count: { $sum: `$${field}` },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);
    };

    // Aggregate comments data
    const aggregateComments = async (interval) => {
      const { start, end } = createDateBoundaries(interval);
      const groupByFormat = interval === 'daily' ? '%Y-%m-%d' : interval === 'monthly' ? '%Y-%m' : '%Y';

      return Post.aggregate([
        {
          $match: {
            createdAt: {
              $gte: start,
              $lte: end,
            },
          },
        },
        {
          $unwind: '$comments'
        },
        {
          $group: {
            _id: {
              $dateToString: { format: groupByFormat, date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);
    };

    const dailyPosts = await aggregateData(Post,'daily');
    const monthlyPosts = await aggregateData(Post,'monthly');
    const yearlyPosts = await aggregateData(Post,'yearly');

    const dailyLikes = await aggregateLikesData('likes', 'daily');
    const monthlyLikes = await aggregateLikesData('likes', 'monthly');
    const yearlyLikes = await aggregateLikesData('likes', 'yearly');

    const dailyComments = await aggregateData(Comment,'daily');
    const monthlyComments = await aggregateData(Comment,'monthly');
    const yearlyComments = await aggregateData(Comment,'yearly');

    res.status(200).json({
      daily: {
        posts: dailyPosts,
        likes: dailyLikes,
        comments: dailyComments,
      },
      monthly: {
        posts: monthlyPosts,
        likes: monthlyLikes,
        comments: monthlyComments,
      },
      yearly: {
        posts: yearlyPosts,
        likes: yearlyLikes,
        comments: yearlyComments,
      },
    });
  } catch (error) {
    next(error);
  }
};
