import {asyncHandler} from '../utils/asyncHandler.js'
import {apiError} from '../utils/apiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { apiResponse } from '../utils/apiResponse.js'
import  jwt  from 'jsonwebtoken'
import mongoose from 'mongoose'


// generate access token , refresh token and save the refresh token in the database..
const generateAccessAndRefreshToken = async(user_id) => {
    try {
       const user = await User.findById(user_id) 
       const refreshToken = user.generateRefreshToken()
       const accessToken = user.generateAccessToken()

       user.refreshToken = refreshToken
       await user.save({ validateBeforeSave : false })

       return { accessToken , refreshToken }
    } catch (error) {
      throw new apiError(500 , "Something went wrong while generating Access & Refresh Token")  

    }
}


    // -------Sign Up - Controller----------

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
    
    const registerUser = asyncHandler( async (req, res) => {
   

    // 1. Getting User details from the Frontend......
    const {fullName, email, username, password } = req.body

    // checking that {fullName , email , username && password} is not empty.
    if (
    [fullName, email, username, password].some((field) => field?.trim() === "")) 
    {
    throw new apiError(400, "All fields are required")
    }


    // checking if user is already exists. {username , email} 
    
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new apiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    // check for avtaar and cover image .. 

    
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }

    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalPath) {
        throw new apiError(400, "avatar file is required")
    }
    if (!coverImageLocalPath) {
        throw new apiError(400, "avatar file is required")
    }

    // upload avtaar and cover-image to cloudinary ....

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new apiError(400, "Avatar file is required")
    }
   


// create user object - create entry in database..
    
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email : email.toLowerCase(), 
        password,
        username: username.toLowerCase()
    })


  // Remove Password and Refresh token field from response. 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new apiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered Successfully")
    )

} )

    // --------Login User - Steps to Follow ------


    // res.body --> data
    // username || email
    // find the user
    // password check 
    // access  token , refresh token
    // send cookies

    const loginUser = asyncHandler(async(req, res) => {
        // Get user credentials from the request body
        const { email, username, password } = req.body;
    
        // Check if either email or username is provided
        if (!(email || username)) {
            throw new apiError(400, "Email or username is required");
        }
    
        // Find the user in the database either by username or email
        const user = await User.findOne({
            $or: [{ username }, { email }]
        });
    
        if (!user) {
            throw new apiError(404, "User does not exist");
        }
    
        // Check if the provided password is correct
        const isPasswordValid = await user.isPAsswordCorrect(password)
    
        if (!isPasswordValid) {
            throw new apiError(401, "Invalid user credentials");
        }
    
        // Generate access token and refresh token
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    
        
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
        // Set options for cookies
        const options = {
            httpOnly: true,
            secure: true
        };
    
        // Set cookies in the response


        // res.cookie("accessToken", accessToken, options);
        // res.cookie("refreshToken", refreshToken, options);
    
        // Return JSON response with user data, access token, and refresh token
        return res
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .status(200)
        .json(
            new apiResponse(
                200,
                 { user: loggedInUser, accessToken, refreshToken },
                  "User logged in successfully"
                  ));
    });
    
 
    const logoutUser = asyncHandler(async(req,res)=>{

        // find the user in database and update the refresh token to undefined.
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken : undefined
                }
            },
            // to get updated value in response.
            {
                new : true
            }
        )

        const options = {
            httpOnly : true ,
            secure : true
        }
        // clear the cookies and return
        return res
        .status(200)
        .clearCookie("accessToken" , options)
        .clearCookie("refreshToken" , options)
        .json(
            new apiResponse(200 , {} , "User Logged out")
        )
})

 const refreshAccessToken = asyncHandler(async()=>{


    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new apiError(401, "Unauthorized Error")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken ,
            REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new apiError(401 , "Invalid User token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(401 , "Refresh Token expired or used")
        }
    
        const options = {
            httpOnly : true ,
            secure : true
        }
    
        const {accessToken , newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken" , accessToken , options)
        .cookie("refreshToken" , newRefreshToken , options)
        .json(
            200 ,
            {accessToken , refreshToken : newRefreshToken },
            "Access Token Refreshed Successfully"
    
        )
    } catch (error) {
        throw new apiError(401 , error?.message || "Invalid Refresh Token")
    }
   
})

// Change Password 
const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword , newPassword }= req.body

    const user = await User.findById(req.user?._id)

    const isPAsswordCorrect = await user.isPAsswordCorrect(oldPassword)

    if (!isPAsswordCorrect) {
        throw new apiError(400 , "Invalid old password")
    }

      user.password = newPassword
    await user.save({validateBeforeSave : true})

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            {},
            "Password Changed Successfully"
        )
    )
})


// Get Current User Data

const getCurrentUser = asyncHandler( async(req , res) =>{
    return res
    .status(200)
    .json(
        new apiResponse(
            200 ,
            req.user ,
            "User Fetched Successfully"
        )
    )
})


// Update fullName and email

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName , email} = req.body

    if ((!fullName || !email)) {
        throw new apiError(400 , "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.body?._id ,
        {
            $set :{
                fullName ,
                email
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiResponse(
            200 ,
            user ,
            "Account Details Updated Succesfully"
        )
    )

})


// Update User avtaar 

const updateUserAvatar = asyncHandler(async (req , res) =>{
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new apiError(400 , "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new apiError(400 , "Error while uploading avatar")
    }

    const user = await user.findByIdAndUpdate(
        req.user?._id ,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new : true}
    )

    return res
    .status(200)
    .json(
        200 , user , "Avatar Updated Successfully"
    )

})

// Update User Cover Image
const updateUserCoverImage = asyncHandler(async (req , res) =>{
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new apiError(400 , "Cover-Image  file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new apiError(400 , "Error while uploading coverImage")
    }

    const user = await user.findByIdAndUpdate(
        req.user?._id ,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {new : true}
    )

    return res
    .status(200)
    .json(
        200 , user , "CoverImage Updated Successfully"
    )


})


// MongoDB aggreation Pipeline
const getUserChannelProfile = asyncHandler( async(req,res) =>{

    const {username} = req.params

    if (!username?.trim()) {
        throw new apiError(400 , "username is missing")
    }

    const channel = await User.aggregate([
        {
          $match: {
            username : username?.toLowerCase()
          } 
        },
        {
            $lookup :{
                from : "subscriptions" ,
                localField : "_id" ,
                foreignField: "channel",
                as : "subscribers"
            }
        },
        {
            $lookup :{
                from : "subscriptions" ,
                localField : "_id" ,
                foreignField: "subscriber",
                as : "subscribedTo"
            }
        },
        {
            addFields :{
                subcribersCount :{
                    $size : "$subscribers"
                },
                channelsSubscribedToCOunt :{
                    $size : "$subscribedTo"
                },
                isSubscribed :{
                    $cond :{
                        $if : {$in : [req.user?._id , "subscribers.subscriber"]},
                        then : true ,
                        else : false 
                    }
                }
            }
        } ,
        {
            $project :{
                username : 1 ,
                fullName : 1 ,
                email : 1 ,
                avatar : 1 ,
                coverImage : 1 ,
                subcribersCount : 1 ,
                channelsSubscribedToCOunt : 1 ,
                isSubscribed : 1 
            }
        }
    ])

    if (!channel?.length) {
        throw new apiError(404 , "Channel does not exists")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200 , channel[0] , "User channel fetched successfully")
    )
})

// Watch History -- Nested Lookup

const getWatchHistory = asyncHandler( async (req ,res)=>{
    const user = await User.aggregate(
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        } ,
        {
            $lookup :{
                from : "viedos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline :[
                    {
                        $lookup :{
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline :[
                                {
                                    $project :{
                                        fullName: 1 ,
                                        username: 1 ,
                                        avatar: 1 
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addField : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    )

    return res
    .status(200)
    .json(
        new apiResponse(
            200 ,
            user[0].watchHistory,
            "watchHistory fetched Successfully"
            )
    )
})



export {
    registerUser ,
    loginUser , 
    logoutUser ,
    refreshAccessToken,
    changeCurrentPassword ,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
    }