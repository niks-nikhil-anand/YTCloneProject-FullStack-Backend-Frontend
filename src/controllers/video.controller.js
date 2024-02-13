import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { apiError } from "../utils/apiError";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { apiResponse } from "../utils/apiResponse";
import { Video } from "../models/video.model";


const isUserOwner = (videoId , req) => {
    const video = Video.findById(videoId)
    if (video?.owner.toString() != req.user?._id) {
       return false ; 
    }

    return true 
}


const getAllVideos = asyncHandler(async(req , res) =>{
    const { page = 1, 
        limit = 10,
        query, 
        sortBy,
        sortType,
        userId 
        } = req.query
    //TODO: get all videos based on query, sort, pagination
        // parse page and limit to numbers.

        page = parseInt(page)
        limit = parseInt(limit)

        // validate and adjust page and limit value.
         
        // ensure page will atleast 1.
        page = Math.max(1 , page)

        // ensure limit will be atleast 20
        limit = Math.min(20 , Math.max(1 , limit))

        const pipeline = []


        // Match videos by owner userId , if Provided
        if (userId) {
            if (!isValidObjectId) {
                throw new apiError(400 ,  "UserId is invalid")
            }
          
            pipeline.push({
                $match : {
                    owner : mongoose.Types.ObjectId(userId)
                }
            })
        }

    //Match Videos based on the query
    if (query) {
        pipeline.push({
            $match : {
                $text : {
                    $search : query
                }
            }
        })
    }

    // Sort pipeline based on the sortBy and sortType
    
    const sortCriteria =  {}

    if (sortBy && sortType) {
        sortCriteria[sortBy] = sortType == "asc"? 1 : -1;
        pipeline.push({
            $sort: sortCriteria
        });
    }else{
        // default sort if sortBy and sortType is not provided
        sortCriteria["createdAt"] = -1
        pipeline.push({
            $sort : sortCriteria
        })
    }

    // Apply pagination using skip and limit

    pipeline.push({
        $skip : (page-1)*limit

    })

    pipeline.push({
        $limit : limit
    })

    // Execute aggreation pipeline

    const Videos = await Video.aggregate(pipeline)
    if (!Videos || Videos.length === 0) {
       throw new apiError(404 , "Videos not found") 
    }

    return res
    .status(200)
    .json(
        new apiResponse(200 , Videos , "Videos fetched sucessfully")
    )








})

const publishVideo = asyncHandler( async(req , res) => {
    const {title , description} = req.body()

    // ---------- TODO - to publishVideo -------------
    // title and description
    // get the video 
    // upload to cloudinary 
    // create a video

    if(!(title && description)){
        throw new apiError(400 , "title and description required ") 
    }

    // get the video path
    let videoLocalPath;
    if (req.file && Array.isArray(req.files.videoFile) && req.file.videoFile[0].length >0) {
        videoLocalPath =  req.file.videoFile[0].path ;
    }

    // get the thumbnail path

    let thumbnailLocalPath ;
    if (req.file && Array.isArray(req.files.thumbnail) && req.files.thumbnail[0].length > 0) {
        thumbnailLocalPath = re.files.thumbnail[0].path ;
    }
    // Api error if video or thumbnail not found
    if (!videoLocalPath) {
        throw new apiError(404 , "Video is required")
    }
    if (!thumbnailLocalPath) {
        throw new apiError(404 , "thumbnail is required")
    }

    // upload on cloudinary 

    const video = uploadOnCloudinary(videoLocalPath)
    const thumbnail = uploadOnCloudinary(thumbnailLocalPath)

    if (!video?.url) {
        throw new apiError(500 , "Error in uploading Video on server")
    }
    if (!thumbnail?.url) {
       throw  new apiError(500 , "Error in uploading thumbnail on server") 
    }

    const newVideo = await Video.create({
        VideoFile : video?.url ,
        thumbnail : thumbnail?.url ,
        title ,
        description ,
        duration : video?.duration ,
        isPublished : true ,
        owner : req.user?._id
    })

    return res
    .status(200)
    .json(
        new apiResponse(
            500 ,
            newVideo ,
            "Video Uploaded Sucessfully"
        )
    )   
})

const getVideoById = asyncHandler(async(req ,res) => {
    const {videoId} = req.params

    if (!videoId) {
        throw new apiError(400 , "Video Id is required")
    }

    const video = await Video.findById(videoId)

    if (!video || (!video.isPublished && !video.onwer.toString() === req.user?._id.toString())) {
        throw new apiError(500 , "Error in fetching the video")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200 , video , "video fetched sucessfully")
    )
})

const updateVideo = asyncHandler(async(req , res) =>  {
    //TODO: update video details
    //  like title, 
    // description, 
    // thumbnail

    const {videoId} = req.params
    const {title , description} = req.body

    if (!videoId) {
        throw new apiError(400 , "Video Id is required")
    }

    // let's check if video is available or not 

    const video = Video.findById(videoId)
    if(!video){
        throw new apiError(404 , " Video Not Found")
    }

    // Let's check logged in user is updating their own video or not.

    const authorized = await isUserOwner(videoId , req)
    if (authorized) {
        throw new apiError(300 , "Unauthorized access")
    }

    

    if (!title || !description) {
        throw new apiError(400 , "Title or description is required")
    }

    let thumbnailLocalPath = req.file?.path 

    if (!thumbnailLocalPath) {
        throw new apiError(500 , "Thumbnail is required") 
    }
    

    // upload thumbnail on cloudinary
    const thumbnail = uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail?.url) {
        throw new apiError(500 , " Error while uploading thumbnail")
    }

    const updateVideo = await Video.findByIdAndUpdate(videoId,
    {
       $set :{
        title : title,
        description : description ,
        thumbnail : req.file?.url
       }
    } ,{
        new : true
    })

    if (!updateVideo) {
        throw new apiError(500 , "Something went wrong while updating Video")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200 , updateVideo , "Video updated succesfully")
    )

})


// delete video from the database 

const deleteVideo = asyncHandler(async(req,res) =>{
    const {videoId} = req.params

    // check video is avilable

    const video = await Video.findById(videoId)

    if (!video) {
        throw new apiError(400 , "Video is not available")
    }

    //check owner is owns the video or not
    const authorized = isUserOwner(videoId , req)

    if (!authorized) {
        throw new apiError(400 , "Unauthroised access" )
    }

    // delete the video 

    const deleteVideo = await Video.findByIdAndDelete(videoId)

    // If there is no video , then it's no relevance to store likes and comments .

    await Comment.deleteMany({video : videoId})
    await Like.deleteMany({video : videoId})

    // remove the video is it existed in any playlist

    const playlists = Playlist.find({videos : videoId})

    for(const playlist of playlists){
        await playlist.findByIdAndUpdate(
            playlist._id ,
            {
                $pull : {videos : videoId}
            } ,
            {
                new : true
            }
        )
    }

    if (!deleteVideo) {
        throw new apiError(500 , " Error while deleting videos")
    }

    return res
    .status(200)
    .json(
        new apiResponse(
            200 ,
            {},
            "Videos deleted successfully"
        )
    )
})

const togglePublishStatus = asyncHandler(async(req,res) => {
    const {videoId} = req.params

    if (!videoId) {
       throw new apiError(400 , "Video Id is required") 
    }

    const video = Video.findById(videoId)

    if (!video) {
        throw new apiError(400 , "Error in fetching video")
    }
    const authorized =  await isUserOwner(videoId , req)
    if (!authorized) {
        throw new apiError(400 , "Unauthorized access")
    }

    const updateVideo = await Video.findByIdAndUpdate(
        videoId , 
        {
            $set :{
                isPublished : !video.isPublished
            }
        },
        {
            new : true
        }
    )

    if (!updateVideo) {
        throw new apiError(500 , "Something went wrong while updating status of the video")
    }

    return res
    .status(200)
    .json(
        new apiResponse(
            200 ,
            {},
            "Video Published Status is toggled succesfully"
        )
    )
})




export {
    publishVideo ,
    getVideoById ,
    updateVideo ,
    deleteVideo,
    togglePublishStatus,
    getAllVideos

}