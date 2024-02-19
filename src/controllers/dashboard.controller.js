import mongoose from "mongoose";
import {asyncHandler} from '../utils/asyncHandler'
import { apiError } from "../utils/apiError";
import  {Video}  from '../models/video.model'
import { apiResponse } from "../utils/apiResponse";

const getChannelSTatus = asyncHandler(async(req,res) =>{
    // TODO:
    //  Get the channel stats like 
    //  total video views, 
    //  total subscribers, 
    //  total videos,
    // total likes etc.

    const userId = req.user?._id 
    if (!userId) {
       throw new apiError(400, "Error while fething userID") 
    }

    try {
        const channelStatus =  Video.aggregate([
            {
               $match : mongoose.Types.ObjectId(userId)
            } ,
            {
                $lookup :{
                    from : "likes" ,
                    localField : "_id",
                    foreignField : "video" ,
                    as : "likes"
                }
            } ,
            {
                $lookup :{
                    from : "subcriptions",
                    localField : "owner",
                    foreignField : "channel" ,
                    as : "Subscribers"
                }
            } ,
            {
                $group : {
                    _id : null ,
                    TotalViews : {$sum : "$views"} ,
                    TotalVideos : {$sum : 1} ,
                    TotalSubcribers : {$first : {$size : "$subcribers"}} 

                }
            } ,
            {
                $project :{
                    _id : 0 ,
                    TotalSubcribers : 1 ,
                    TotalLikes : 1 ,
                    TotalVideos : 1 ,
                    TotalViews : 1
                }
            }
        ])

        if (!channelStatus) {
            throw new apiError(500 , "Unable to fetch the channel Status")
        }

        return res
        .status(200)
        .json(
            new apiResponse(200 , channelStatus[0] , "channel status fetched Successfully")
        )


    } catch (error) {
        throw new apiError(500 , error?.message || "Error while fething information")
    }

})

const getChannelVideos = asyncHandler(async(req,res) =>{
    // get all viedos uploaded by the channel .
    const userId = req.user?._id
    if (!userId) {
        throw new apiError(400 , "Unauthorised access")
    }

    try {
        
        const videos =  await Video.find({onwer :userId})

        if (!videos || videos.length === 0) {
            return res
            .status(200)
            .json(
                new apiResponse(200 , videos , "No videos published yet" )
            )    
        }

        return res
        .status(200)
        .json(
            new apiResponse(
                200 , 
                 videos , 
                 "video fetched successfully" 
            )
        )





    } catch (error) {
        throw new apiError(500 , error?.message || "Unable to fetch the videos")
    }
})

export {
    getChannelSTatus ,
    getChannelVideos
}