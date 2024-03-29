import mongoose, { Mongoose } from "mongoose";
import {asyncHandler} from '../utils/asyncHandler'
import {apiResponse} from '../utils/apiResponse'
import {apiError} from '../utils/apiError'
import { Playlist } from '../models/playlist.model'
import {Video} from '../models/video.model'
import {User} from '../models/user.model'

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
        const {playlistId , videoId} = req.params

        if (!playlistId || !videoId) {
            throw new apiError(400 , "PlaylistId and videoId is required")
        }

        try {
            // check he is the owner of the playlist or not?

            const isOwner = isOwnerOfPlaylist(playlistId , req?.user?._id)

            if (!isOwner) {
                throw new apiError(300, "Unauthorized access")
            }


            // now check video is available and published or not
            const video = Video.findById(videoId)

            if (!video) {
               throw new apiError(404 , "Video not found") 
            }

            // check video is already added to the playlist or not

            const playlist = await Playlist.findById(playlistId)

            if (!playlist.video.includes(videoId)) {
                throw new apiError(404 , "No video is available in the Playlist")
            }

            // Now remove the video from the Playlist

            // if video is not published
            if (!video?.isPublished) {
                const removeVideo = await Playlist.updateOne({
                    _id : Mongoose.Types.ObjectId(playlistId)
                } ,
                {
                    $pull : {
                        video : videoId
                    }
                })

                if (!removeVideo) {
                    throw new apiError(500 , "Unable to remove video from the playlist retry!!!" )
                }

                return res
                .status(200)
                .json(
                    new apiResponse(
                        200 , 
                        {},
                        "Video Not found in the playlist"
                    )
                )
            }
        const removeVideo = await Playlist.updateOne({
            _id : Mongoose.Types.ObjectId(playlistId)
        } ,
        {
            $pull : {
                video : videoId
            }
        })

        if (!removeVideo) {
            throw new apiError(500 , "Unable to remove video from the playlist retry!!!")
        }

        return res
        .status(200)
        .json(
            new apiResponse(
                200 , 
                removeVideo ,
                "Video remove from the playlist successfully"
            )
        )

        } catch (error) {
            throw new apiError(500 , error?.message || "Unable to remove video from the playlist")
        }
})


const deletePlaylist = asyncHandler(async(req,res) =>{
    const {playlistId} = req.params

    if (!playlistId) {
        throw new apiError(400 , "PlaylistId is required")
    }

    try {
        
        // check user is the owner of the playlist or not 
        const isOwner = isOwnerOfPlaylist(playlistId , req?.user?._id)

        if (!isOwner) {
            throw new apiError(300 , "Unauthorised access")
        }

        const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

        if (!deletedPlaylist) {
            throw new apiError(500 , "Unable to delete the playlist")
        }

        return res
        .status(200)
        .json(
            new apiResponse(
                200 , 
                deletedPlaylist ,
                "Playlist is deleted successfully"
            )
        )

    } catch (error) {
        throw new apiError(500 , error?.message || "Unable to delete playlist")
    }
})

const updatePlaylist = asyncHandler(async(req, res) => {

    // update Playlist
    const {playlistId} = req.params

    const {name , description} = req.body

    if (!playlistId) {
        throw new apiError(400 , "PlaylistId is required")
    }

    try {
        //check user is the owner of the playlist or not ?
    
        const isOwner = isOwnerOfPlaylist(playlistId , req?.user?._id)
    
        if (!isOwner) {
            throw new apiError(300 , "Unauthorized Access")
        }

        // now update playlist

        const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId ,{
            $set : {
                name : name ,
                description : description
            }
        })

        if (!updatedPlaylist) {
            throw new apiError(500 , "Something went wrong while updating the Playlist")
        }

        return res
        .status(200)
        .json(
            new apiResponse(
                200 ,
                updatedPlaylist ,
                "Playlist is updated successfully"
            )
        )
    
    } catch (error) {
        throw new apiError(500 , error?.message || "Unable to update playlist")
    }

})

const getPlaylistById = asyncHandler(async(req,res) =>{
    const {playlistId} = req.params

    if (!playlistId) {
        throw new apiError(400 , "PlaylistId is required")
    }

    try {
        const playlist = await Playlist.aggregate([
            {
                $match : {
                    _id : new mongoose.Types.ObjectId(playlistId)
                }
            } ,
            {
                // if the user is the owner of the playlist , then he can also see unpublished video also , but if he is not the owner of the playlist he will only see the publsihed videos.

                $project :{
                    name : 1 ,
                    description : 1 ,
                    owner : 1 ,
                    video : {
                        $cond : {
                            if :{
                                $eq :["$owner" , new mongoose.Types.ObjectId(req?.user?._id)]
                            } ,
                            then : "$video" ,
                            else: {
                                $filter : {
                                    input : "$video" ,
                                    as : "video" ,
                                    cond : {
                                        $eq : ["$$video.isPublished" , true]
                                    }
                                }
                            } 
                        }
                    } ,
                    createdAt : 1 ,
                    updatedAt : 1
                }  
            }
            

        ])

        if (!playlist || playlist.length === 0) {
            throw new apiError(404 , "Playlist not found ")
        }

        return res
        .status(200)
        .json(
            new apiResponse(
                200 , 
                playlist ,
                "Playlist is fetched succesfully"
            )
        )
    } catch (error) {
       throw new apiError(500 , error?.message || "Playlist id is incorrect") 
    }

})

const getUserPlaylists = asyncHandler(async(req , res) => {
   const {userId} = req.params
   
   if (!userId) {
    throw new apiError(400 , "User id is required")
   }

   try {
    const user = await User.findById(userId)

    if (!user) {
        throw new apiError(500 , "User not found")
    }

    const playlist = await Playlist.aggregate([{
        $match :{
            owner : user?._id
        }
    },
    {
        $project :{
            _id : 1 ,
            name : 1 ,
            description : 1 ,
            owner : 1 ,
            createdAt : 1 ,
            updatedAt : 1 ,
            video : {
                $cond : {
                    if:{$eq:["onwer" , new mongoose.Types.ObjectId(req?.user?._id)]},
                    then : "$video" ,
                    else :{
                        $filter : {
                            input : "$video" ,
                            as : "video" ,
                            cond:{
                                $eq : ["$video.isPublished" , true]
                            }
                        }
                    }
                }
            }
        }
    }
])
    if (!playlist) {
        throw new apiError(404 , "There is no playlist made by this user")
    }

    return res
    .status(200)
    .json(
        new apiResponse(
            200 , 
            playlist ,
            "Playlist fetched successfully"
        )
    )

   } catch (error) {
    throw new apiError(500 , error?.message || "Unable to fetch user playlist")
   }
})

export {
    createPlaylist ,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist ,
    updatePlaylist ,
    getPlaylistById ,
    getUserPlaylists


}