import mongoose from "mongoose";
import {asyncHandler} from '../utils/asyncHandler'
import {apiResponse} from '../utils/apiResponse'
import {apiError} from '../utils/apiError'
import { Playlist } from '../models/playlist.model'
import {Video} from '../models/video.model'

const isOwnerOfPlaylist = asyncHandler(async(playlistId , userId) =>{
    try {
        const playlist = await Playlist.findById(playlistId)

        if (!playlist) {
            throw new apiError(400 , "Playlist doesn't exists")
        }

        if(playlist?.owner.toString() !== userId.toString()){
            return false
        }

        return true

    } catch (error) {
        throw new apiError(404 , error?.message || "No Playlist Found")
    }
})
const createPlaylist = asyncHandler(async(req,res) =>{

    const {name , description} =  req.body 

    if (!name) {
        throw new apiError(400 , "Name Of the playlist is required")
    }

    let playlistDescription = description || ""

    try {
        
        const playlist = await Playlist.create({
            name ,
            playlistDescription ,
            owner : req.user?._id ,
            video : []
        })

        if (!playlist) {
            throw new apiError(500 , "Something happend error while creating playlist")
        }

        return res
        .status(200)
        .json(
            new apiResponse(
                200 , 
                playlist ,
                "Playlist created Successfully"
            )
        )

    } catch (error) {
        throw new apiError(500 , error?.message || "Unable to create playlist")
    }

})

const addVideoToPlaylist = asyncHandler(async(req,res) =>{
    const {playlistId , videoId} = req.params

    if (!playlistId || !videoId) {
        throw new apiError(400 , "playlist and videoId , both required")
    }

    try {

        // check user is the owner of the playlist ?
        const userOwner = isOwnerOfPlaylist(playlistId , req.user?._id)

        if (!userOwner) {
            throw new apiError(300 , "Unauthorized Access")
        }

        const video = await Video.findById(videoId)

        if (!video || (!(video?.owner.toString() === req.user?._id.toString()) && !video?.isPublished)) {
            throw new apiError(404 , "Video not found")
        }

        // check if the video is already added to the playlist or not.

        const playlist = await Playlist.findById(playlistId)
        if (!playlist.video.includes(videoId)) {
            return res
            .status(200)
            .json(
                new apiResponse(
                    200 , 
                    {} ,
                    "Video is already present in the playlist"
                )
            )
        }

        const addedPlaylist = await Playlist.updateOne({
            _id : mongoose.Types.ObjectId(playlistId)
        } ,
        {
            $push : {video : videoId}
        })

        if (!addedPlaylist) {
            throw new apiError(500 , "Unable to add video to the playlist")
        }

        return res
        .status(200)
        .json(
            new apiResponse(
                200 , 
                addedPlaylist ,
                "video added to the playlist successfully"
            )
        )




    } catch (error) {
        throw new apiError(500 ,  error?.message || "Unable to add video to the playlist")
    }
})

const removeVideoFromPlaylist = asyncHandler(async(req,res) =>{
    
})


export {
    createPlaylist ,
    addVideoToPlaylist,
    removeVideoFromPlaylist

}