import mongoose, {Schema} from "mongoose";

const userSchema = Schema(
    {
        username :{
          type: String,
          required : true ,
          unique : true ,
          index : true ,
          lowercase : true ,
          trim : true  
        } ,
        email : {
            type : String ,
            required : true ,
            unique : true, 
            lowercase : true,
            trim : true
        } ,
        fullname :{
            type : String ,
            required : true ,
        },
        avtaar : {
            type : String ,  // cloudinary
            required : true
        },
        coverimage : {
            type : String // cloudinary
        },
        watchHistory :{
            type : Schema.Types.ObjectId,
            ref : "Video"
        },
        password :{
            type : String ,
            required : [true , "Password is required"]
        },
        refreshToken : {
            type : String
        }
    },
    {
        timestamps : true
    }
)


export const User = mongoose.model("User" , userSchema)