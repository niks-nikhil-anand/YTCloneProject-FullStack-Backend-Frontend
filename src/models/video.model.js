import mongoose , {Schema} from "mongoose";

const video = Schema(
    {
        videoFile : {
            type : String , //cloudinary
            required : true
        },
        thumbnail:{
            type : String ,  //cloudinary
            required: true
        },
        title:{
            type : String ,
            required: true
        },
        description :{
            type : String ,
            required : true
        },
        duration :{
            type : Number ,
            required : true
        },
        views :{
            type : Number,
            default : 0
        },
        isPublished :{
            type : Boolean,
            default : true 
        },
        owner :{
            type : Schema.Types.ObjectId ,
            ref : "User"
        }
    }
    ,{timestamps : true}
    )