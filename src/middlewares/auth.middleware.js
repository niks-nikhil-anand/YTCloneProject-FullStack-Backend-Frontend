import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from'jsonwebtoken'
import { User } from "../models/user.model.js";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {

        // get access token from re.cookies or from Authorization Bearer
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        // If token is not available - Throw error.
        if(!token){
            throw new apiError(401 , "Unauthorized request")
        }
        

        // Decode Access token using "jwt.verify" with the help of secret key
        const decodeToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
    
        // find the user with the "_id" in the Decoded value.
        const user = await User.findById(decodeToken?._id).select("-password -refreshToken");
        

       if (!user) {
        throw new apiError(401 , "invalid access token")
       }
    
       // add user object in the req.
       req.user = user ;                    
       next()
       
    } catch (error) {
        throw new apiError(401 , error?.message || "Inavlid access token")
    }
})