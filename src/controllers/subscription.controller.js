import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import {apiError} from  '../utils/apiError'
import {subscriptions}  from '../models/subscriptions.model'
import {apiResponse} from '../utils/apiResponse'


const toggleSubscription = asyncHandler(async(req,res) => {
    const channelId = req.params
    // toggle subcriptions
    if (!channelId) {
        throw new apiError(400 ,"Channel ID is required") 
    }
    const userId = req.user?._id
    const credentials = {
        subcriber : userId ,
        channel : channelId
    }

    try {
        const subscribed = await subscriptions.findOne(credentials)

        if (!subscribed) {
            // if not subcribed , then create one credentials

            const newSubscription =  await subscriptions.create(credentials)

            if (!newSubscription) {
                throw new apiError(500 , "Unable to Subcribe the channel")
            }

            return res
            .status(200)
            .json(
                new apiResponse(
                    200 , 
                    newSubscription ,
                    "Channel Subcribed Successfully"
                )
            )



        }else{

            // if subscribed , then delete the credentials
            const deleteCredentials = await subscriptions.deleteOne(credentials)

            if (!deleteCredentials) {
                throw new apiError(500 , "Unable to Unsubscribe channel")
            }

            return res
            .status(200)
            .json(
                new apiResponse(
                    200 ,
                    deleteCredentials ,
                    "Channel Unsubscribe Successfully"
                )
            )
        }



    } catch (error) {
       throw new apiError(500 , error?.message || "Unable to toggle Subcriptions ") 
    }
})

const getUserChannelSubscribers = asyncHandler(async(req,res) =>{
    const {subscriberId} = req.params

    if (!subscriberId) {
        throw new apiError(400 , "channelId is required")
    }

    try {
        
        const subscribers =  subscriptions.aggregate([
            {
                $match :{
                    channel : new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $group : {
                    id : "channel",
                    subscribers :{$push :"$subscriberId"}
                }
            } ,
            {
                $project : {
                    _id : 0 ,
                    subscribers : 1
                }
            }
        ])

        if (!subscribers || subscribers.length ===0) {
            return res
            .status(200)
            .json(
                new apiResponse(
                    200 ,
                    [],
                    "No Subcribers found on the channel"
                )

            )
        }


        return res
            .status(200)
            .json(
                new apiResponse(
                    200,subscribers,"All Subscribers fetched Successfully!!"
                )

            )


    } catch (error) {
       throw new apiError(500 , error?.message || "Unable to fetch channel subcribers") 
    }
})

const getSubscribedChannels = asyncHandler(async(req,res) =>{
    const {channelId} = req.params

    if (!channelId) {
        throw new apiError(400 , "ChannelId is required")
    }

    try {


        const subscribedChannel = subscriptions.aggregate([
            {
                $match :{
                    subcriber: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $group :{
                    _id : "subscriber" ,
                    subscribedChannel : {$push : "$channel"}
                }
            } ,
            {
                $project :{
                    _id : 0,
                    subscribedChannel : 1
                }
            }
        ])

        if (!subscribedChannel || subscribedChannel.length === 0) {
            return res
            .status(200)
            .json(
                new apiResponse(
                    200 , 
                    [],
                    "No subscribed channel found for the user"
                )
            )
        }


        return res
        .status(200)
        .json(
            new apiResponse(
                200 ,
                subscribedChannel ,
                "All Subscribed channel fetched successfully"
            )
        )
    } catch (error) {
       throw new apiError(500 , error?.message || "Unable to fetch subscribed channel") 
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels

}