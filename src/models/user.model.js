import mongoose, {Schema} from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = Schema(
    {
        username:{
          type: String,
          required : true ,
          unique : true ,
          index : true ,
          lowercase : true ,
          trim : true  
        } ,
        email: {
            type : String ,
            required : true ,
            unique : true, 
            lowercase : true,
            trim : true
        } ,
        fullName:{
            type : String ,
            required : true ,
        },
        avatar : {
            type : String ,  
            required : true
        },
        coverImage : {
            type : String ,
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

    this.password = await bcrypt.hash(this.password , 10)
    next()
})

userSchema.methods.isPAsswordCorrect = async function(password){
   await bcrypt.compare(password , this.password)
}

userSchema.methods.generateAccessToken = function (){
    return jwt.sign({
        _id : this._id,
        username : this.username,
        email : this.username,
        fullName : this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}
userSchema.methods.generateRefreshToken  = function (){
    return jwt.sign({
        _id : this._id ,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
       expiresIn : process.env.REFRESH_TOKEN_SECRET
    }
    )
}



export const User = mongoose.model("User" , userSchema)