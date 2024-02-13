import mongoose from "mongoose"; 
import { asyncHandler } from "../utils/asyncHandler";
import { apiResponse } from "../utils/apiResponse"; 
import {apiError} from '../utils/apiError'
import { Tweet } from "../models/tweet.model";



const createTweet = asyncHandler(async(req,res) =>{

    const {tweetContent} = req.body 
    if (!tweetContent) {
        throw new apiError(400 , "Tweet content is required")
    }

    try {
        const tweet = await Tweet.create({
            content : tweetContent ,
            owner : req.user?._id
        })

        if (tweet) {
            throw new apiError(500 , "unable to create tweet")
        }

        return res
        .status(200)
        .json(
            200 ,
            tweet,
            "Tweet is successfully published "
        )


    } catch (error) {
       throw new apiError(500 , error?.message || "Unable to create twwet") 
    }

})

const getUserTweet = asyncHandler(async(req,res) =>{
    const {userId} = req.params
    if (!userId) {
        throw new apiError(400 , " UserID is required")
    }

    try {
        // check userId is correct 

        const tweet = Tweet.aggregate([{
            $match :{
                owner : mongoose.Types.ObjectId(userId)
            }
        },
        {
           $group :{
            _id : "owner" , 
            tweet : {
                $push : "$content"
            }
           } 
        },
        {
            $project :{
                _id : 0 ,
                tweet:1
            }
        }])

        if (!tweet || tweet.length === 0) {
            return res
            .status(200)
            .json(
                new apiResponse(200 , [] , "User have no tweet" )
            )
        }

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            tweet,
            "User tweet is successfully fetched"
        )
    )


    } catch (error) {
        throw new apiError(500 , "Error while fetching the tweet")
    }
})

const updateTweet = asyncHandler(async(req,res) =>{
    const {tweetId} = req.params
    const {tweetContent}  = req.body

    if (!tweetId) {
        throw new apiError(400 , "Tweet Id is required")   
    }
    try {
       const existingTweet = Tweet.findById(tweetId) 

       if (!existingTweet) {
            throw new apiError(404 , "No tweet is found")
       }

       // check user is owner of the tweet or not ?

       if (existingTweet.owner.toString() !== req.user?._id) {
        throw new apiError(300 , "Unauthorised access")
       }

       const updatedTweet = Tweet.findByIdAndUpdate({
        $set :{
            tweet : tweetContent
        }
       },{
        new : true
       })

       if (!updateTweet) {
        throw new apiError(500 , "Unble to update tweet")
       }

       return res
       .status(200)
       .json(
        new apiResponse(
            200 ,
            updateTweet ,
            "Tweet updated successfully"
            )
       )

    } catch (error) {
        throw new apiError(500 , error?.message || "Error while updating tweet")
    }

})

const deleteTweet = asyncHandler(async(req,res) =>{
    const {tweetId} = req.params

    if (!tweetId) {
        throw new apiError(400 , "Tweet Id is required")
    }

    try {
        const tweet = Tweet.findById(tweetId)
        if (!tweet) {
            throw new apiError(404 , "Tweet not found")
        }

        // check he is thw owner of the tweet

        if (tweet.owner.toString() !== req.user._id) {
            throw new apiError(300 , "Unauthorised access")
        }

        const deletetweet = Tweet.findByIdAndDelete(tweetId)

        if (!deletetweet) {
            throw new apiError(500 , "Error while delete the tweet")
        }

        return res
        .status(200)
        .json(
            new apiResponse(
                200 ,
                {},
                "Tweet delete successfully"
            )
        )


    } catch (error) {
        throw new apiError(500 , error?.message || "Unable to delete tweet")
    }
})



export {
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet
}