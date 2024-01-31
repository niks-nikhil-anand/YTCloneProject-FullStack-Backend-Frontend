import mongoose, {Schema} from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

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

userSchema.pre("save" , async function (next){
    if(!this.isModified("password"))  return next()

    this.password = bcrypt.hash(this.password , 10)
    next()
})

userSchema.methods.isPAsswordCorrect = async function(password){
   await bcrypt.compare(password , this.password)
}

export const User = mongoose.model("User" , userSchema)