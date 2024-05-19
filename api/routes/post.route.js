import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { create, deletepost, getGraphData, getPostLikeStatus, getposts, likePost, toggleHidePost, updatepost } from '../controllers/post.controller.js';

const router = express.Router();

router.post('/create', verifyToken, create)
router.get('/getposts', getposts)
router.delete('/deletepost/:postId/:userId', verifyToken, deletepost)
router.put('/updatepost/:postId/:userId', verifyToken, updatepost)

router.patch('/toggle-hide/:postId',verifyToken, toggleHidePost);

router.post('/like/:postId', verifyToken, likePost)
router.get('/like-status/:postId/', verifyToken, getPostLikeStatus)

router.get('/statistics', verifyToken, getGraphData)


export default router;