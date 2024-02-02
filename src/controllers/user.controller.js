import {asyncHandler} from '../utils/asyncHandler.js'
import {apiError} from '../utils/apiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { apiResponse } from '../utils/apiResponse.js'

const registerUser = asyncHandler(async (req,res)=>{
    // get user details from the frontend
    // validation - !empty?
    // check user is already exists.:-  username && email
    // check for images , check for avtaar
    // upload to cloudinary , avtaar
    // create user object and create entry in DB
    // remove password and refresh token field  from response.
    // check for user creation.
    // return res.

    const {username , email , fullName , password} = req.body
    console.log("email :" , email )
    if([username , email,fullName , password]
        .some((fields)=> fields?.trim() === "")){
            throw new apiError(400 , "All fileds are required")
    }

    const existedUser = User.findOne({
        $or : [{ username } , { email }]
    })

    if(existedUser){
        throw new apiError(409 , "User with email or username already existed ")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new apiError(400 , "avatar Required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new apiError(400  , "avatar is required ")    
    }

     const user = await User.create({
        username ,
        avatar: avatar.url ,
        coverImage : coverImage?.url || "" ,
        email : email.tolowercase ,
        password ,
        username  : username.tolowercase 
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new apiError(500 , "someting went wrong while registering the user ")
    }

    return res.status(200).json(
        new apiResponse("200" , createdUser , "User registered Succesfully")
    )

})


export {registerUser}