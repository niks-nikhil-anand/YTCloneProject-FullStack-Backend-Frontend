import mongoose from "mongoose";
import {Like} from '../models/like.model'
import { asyncHandler } from "../utils/asyncHandler";
import {apiError} from '../utils/apiError'
import {Video} from '../models/video.model'
import {apiResponse} from '../utils/apiResponse'
import {Tweet} from '../models/tweet.model'

const toggleVideoLike = asyncHandler(async(req,res)=>{
    const {videoId} = req.params

    if (!videoId) {
        throw new apiError(400, "VideoId is required") 
    }

    try {
        const video = Video.findById(videoId)
        if (!video || !video.isPublished) {
            throw new apiError(404 , "Video not found")
        }

        const likeCriteria = {
            video : videoId ,
            user : req.user?._id   
        }
        const alreadyLiked = Like.findOne(likeCriteria)
        // if not alreday lIKE
        if (!alreadyLiked) {
            const newLike = await Like.create(likeCriteria)
            if (!newLike) {
                throw new apiError(500, "Unable to like video")  
            }
            return res
            .status()
            .json(
                new apiResponse(200 , newLike ,"Successfully liked the video")
            )
        }

        const disLike = await Like.deleteOne(likeCriteria)
        if (!disLike) {
            throw new apiError(500 , "unable to dislike the video")
        }

        return res
        .status(200)
        .json(
            new apiResponse(
                200 , 
                disLike ,
                "Successfully Dislike the video"
            )
        )


    } catch (error) {
        throw new apiError(500 , "Error while toggle like")
    }

})

const toggleCommentLike = asyncHandler(async(req, res) =>{
    const {commentId} = req.params
    if (!commentId) {
        throw new apiError(400 , "Comment Id is required")
    }

    try {
        // check commentId is right or not?

        const comment = await Comment.findById(commentId)
        if (!comment) {
           throw new apiError(404 , "Comment not found") 
        }

        const likeCriteria = {
            comment : commentId , 
            user : req.user?._id
        }
        const alreadyLiked = await Like.findOne(likeCriteria)

        if (!alreadyLiked) {
            const newLike = await Like.create(likeCriteria)

            if (!newLike) {
                throw new apiError(500 , "Unable to like the comment")
            }

            return res
            .status(200)
            .json(
                new apiResponse(
                    200 , 
                    newLike , 
                    "Successfully Liked the comment"
                )
            )
        }


        const disLike = await Like.deleteOne(likeCriteria)

        if (!disLike) {
            throw new apiError(500 , "Unable to delete the video")
        }

        return res
        .status(200)
        .json(
            new apiResponse(
                200 , 
                {},
                "Successfully Disliked the comment"
            )
        )
    } catch (error) {
        throw new apiError(500 , error?.message || "Error while toggle comment Like")
    }
})

const ToggleTweetLike = asyncHandler(async(req, res) =>{
    const {tweetId} = req.params

    if (!tweetId) {
        throw new apiError(400, "tweet Id is required")
    }

    try {
        const tweet = await Tweet.findById(tweetId)
    
        if (!tweet) {
            throw new apiError(404 , "Tweet not found")
        }

        const likecriteria = {
            tweet : tweetId ,
            user : req.user?._id
        }

        const alreadyLiked = await Like.findOne(likecriteria)

        if (!alreadyLiked) {
            const newLike = await Like.create(likecriteria)

            if (!newLike) {
                throw new apiError(500 , "Unale to like tweet")
            }
            return res
            .status(200)
            .json(
                new apiResponse(
                    200 ,
                    newLike ,
                    "successfully Liked the tweet"
                )
            )
        }

        const disLike = await Like.deleteOne(likecriteria)
        if (!disLike) {
            throw new apiError(500 , "Error while dislike the tweet")
        }

        return res
        .status(200)
        .json(
            new apiResponse(
                200 , 
                {},
                "Successfully dislike the tweet"
            )
        )
    } catch (error) {
        throw new apiError(500 , Error?.message || "Error to toggle Tweet Like")
    }  
})

const getDislikeVideo =  asyncHandler(async(req,res) =>{
    const {userId} = req.params
    if (!userId) {
        throw new apiError(400, "userId is required")
    }

    try {
        const likedVideos =  await Like.aggregate([
            {
                $match :{
                    likedBy : new mongoose.Types.ObjectId(userId)
                }
            } ,
            {
                $lookup :{
                    from : "videos",
                    localField : "video" ,
                    foreignField : "_id" ,
                    as : "likedVideos"
                }
            },
            {
                $unwind : "$likedVideos"
            },
            {
                $match : {
                    "likedVideos.isPublished" : true
                }
            },
            {
                $lookup :{
                    from : "users" ,
                    let : {owner_id : "$likedVideos.owner"},
                    pipeline :[
                        {
                            $match : {
                                $expr : {$eq : ["$_id , $$owner_id"]}
                            }
                        } ,
                        {
                            $project :{
                                _id: 0,
                                username: 1,
                                avatar: 1,
                                fullName: 1
                            }
                        }
                    ] ,
                    as : "owner" 
                }
            },
            {
                $unwind: { path: "$owner", preserveNullAndEmptyArrays: true }
            } ,
            {
                $project: {
                    _id: "$likedVideos._id",
                    title: "$likedVideos.title",
                    thumbnail: "$likedVideos.thumbnail",
                    owner: {
                        username: "$owner.username",
                        avatar: "$owner.avatar",
                        fullName: "$owner.fullName"
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    likedVideos: { $push: "$$ROOT" }
                }
            },
            {
                $project: {
                    _id: 0,
                    likedVideos: 1
                }
            }
        ]);

        
        if (likedVideos.length === 0) {
            return res
                .status(404)
                .json(new apiResponse(404, [], "No liked videos found"));
        }
        
        return res
        .status(200)
        .json(new apiResponse(200,likedVideos,"LikedVideos fetched Successfully!"))


    } catch (error) {
        throw new apiError(500 , error?.message || "Unable to fetch the liked Videos")
    }
})



export {
    toggleVideoLike,
    toggleCommentLike,
    ToggleTweetLike,
    getDislikeVideo
}