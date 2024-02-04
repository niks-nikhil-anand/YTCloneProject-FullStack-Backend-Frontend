import {asyncHandler} from '../utils/asyncHandler.js'
import {apiError} from '../utils/apiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { apiResponse } from '../utils/apiResponse.js'


// generate access and refresh token

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

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new apiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new apiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new apiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

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

 const loginUser =  asyncHandler(async(req,res)=>{
    // res.body --> data
    // username || email
    // find the user
    // password check 
    // access  token , refresh token
    // send cookies

    const {email , username , password} = req.body

    if (!(email || username)) {
        throw new apiError(400 , "email or username is required")
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    if (!user) {
        throw new apiError(404 , "user does not exist")
    }

     const isPasswordValid = await user.isPAsswordCorrect(password)

     if (!isPasswordValid) {
        throw new apiError(401 , "Invalid user credentials")
     }

     const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)
     
     
     const loggedInUser = User.findById(user._id).select
     (" -password , -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookies("accessToken", accessToken , options)
    .cookies("refreshToken" , refreshToken , options)
    .json(
        new apiResponse(
            200 ,
            {
                user : loggedInUser ,
                accessToken ,
                refreshToken
            },
                "USer loggedIn Successfully"  
        )
    )
 })  
 
    const loggedoutUser = asyncHandler(async(req,res)=>{
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken : undefined
                }
            },
            {
                new : true
            }
        )

        const options = {
            httpOnly : true ,
            secure : true
        }

        return res
        .status(200)
        .clearCookies("accessToken" , option)
        .clearCookies("refreshToken" , option)
        .json(
            new apiResponse(200 , {} , " User Logges out")
        )
})
export {registerUser , loginUser , loggedoutUser}