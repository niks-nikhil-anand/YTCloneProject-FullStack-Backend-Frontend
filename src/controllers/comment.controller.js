import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { apiError } from "../utils/apiError";
import {Video} from '../models/video.model'
import {Comment} from '../models/comment.model'
import { apiResponse } from "../utils/apiResponse";



// get video Comments

const getVideoComments = asyncHandler(async(req ,res) =>{
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!videoId) {
        throw new apiError(400 , "VideoId is required")
    }

    // check videoId is correct

    const video = await Video.findById(videoId)
    if (!video) {
       // if video is not available , delete all comments of that video
       await Comment.deleteMany({video : videoId}) 
       throw new apiError(400 ,  "There is no such video")
    }

    // check video is published 

    if (!video.isPublished) {
        throw new apiError(500 , "Video is Unpublished")
    }

    const commentAggregate =  Comment.aggregate([
        {
            $match :{
                video : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup : {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            }
        },
        {
           $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment",
                    as: "likes",
                },
        } ,
        {
            $addFields: {
                likesCount: {
                    $size: "$likes",
                },
                owner: {
                    $first: "$owner",
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            },
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                },
                isLiked: 1
            },
        },
    ]);
    
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };
    const comments = await Comment.aggregatePaginate(
        commentAggregate,
        options
    );

    if(!comments || comments.length === 0){
        return res
        .status(200)
        .json(new apiResponse(200,{},"No commments in this video!!"))
    }
    return res
    .status(200)
    .json(new apiResponse(200,comments,"Comments of the video fetched Successfully"))

})


// addComment
const addComment = asyncHandler(async(req , res) =>{
    const {commentContent} = req.body
    const {videoId} = req.params

    if (!videoId) {
        throw new apiError(400 , "Video Id is required")
    }

    try {
        const video = await Video.findById(videoId)
        if (!video || !video.isPublished) {
            throw new apiError(404 , "Video Not Found")
        }

        if (!commentContent) {
            throw new apiError(404 , "Comment Not found")
        }

        const comment = await Comment.create({
            content : commentContent ,
            video : videoId ,
            owner : req.user?._id
        })

        return res
        .status(200)
        .json(
            200 ,
            comment ,
            "Comment posted Successfully"
        )
    } catch (error) {
        throw new apiError(500 , "Unable to create Comment")
    }
})

//update comment
const updateComment = asyncHandler(async(req,res) => {
    const {commentId} = req.params
    const {commentContent} = req.body

    if (!commentId) {
        throw new apiError(400 , "CommentId is required")
    }

    try {
        const comment = await Comment.findById(commentId)
        if(!comment){
            throw new apiError(404 , "Comment Not found")
        }

        //check video is published
        const videoId = await mongoose.Types.ObjectId(comment.video)

        const video = Video.findById(videoId)

        // if , video does not exists then comment should be deleted 
        if (!video) {
           await Comment.deleteMany({video :videoId}) 
           return res 
           .status(400)
           .json(
            300 , {} , "Video doesn't exists"
           )
        }
        if (!video.isPublished) {
           throw new apiError(300 , "Video doesn't exists") 
        }

        // check comment owner is updating the comment or not

        if (comment.owner !== req.user?._id) {
            throw new apiError(300 , "Unauthroised Access")
        }

        // check if comment content is available

        if (!commentContent) {
            throw apiError(400 , "comment content is required")
        }

        // now , update comment 

        const updateComment = Comment.findByIdAndUpdate({
            $set : {
                content : commentContent
            }
        } ,{
            new : true
        })

        if (!updateComment) {
            throw new apiError(500 , "Unable to update comment")
        }

        return res
        .status(200)
        .json(
            new apiResponse(
                200 , updateComment , "Comment update sucessfully"
            )
        )




    } catch (error) {
        throw new apiError(500 , " Unable to update comment")
    }
})


const deleteComment =  asyncHandler(async(req ,res) =>{
    const {commentId} = req.params
    
    if (!commentId) {
        throw new apiError(400 , "comment Id is required")
    }

    try {

        // check comment is available
        const comment = Comment.findById(commentId)
        if (!comment) {
            throw new apiError(404 , "Comment not found")
        } 

        // check video is published
        const videoId = await mongoose.Types.ObjectId(comment.video)
        const video =  await Video.findById(videoId)
        if (!video) {
            // delte the comment
            await Comment.deleteMany({video : videoId})
        }
        if (video.owner.toString() !== req.user?._id.toString() && !video.isPublished) {
            throw new apiError(300 , "There is no such video")
        }

        // check he is owner of the comment of or not

        if (comment.owner.toString() !== req.user?._id.toString()) {
            throw new apiError(300 , "Unauthroised error")
        }

        // now , delete the comment

        const deleteComment = Comment.findByIdAndDelete(commentId)

        if (!deleteComment) {
            throw new apiError(500 , "Error while deleting the comment")
        }

        return res
        .status(200)
        .json(
            200 ,
            {},
            "Comment delted Successfully"
        )

        
        
    } catch (error) {
        throw new apiError(500 , error?.message || "Unable to delete comment")
    }
})

export {
    addComment,
    updateComment,
    getVideoComments,
    deleteComment
}