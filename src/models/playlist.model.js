import mongoose, { Schema } from "mongoose";

const playlistSchema = Schema(
    {
        name :{
            type : String ,
            required : true
        },
        description :{
            type : true
        },
        owner : {
            type : Schema.Types.ObjectId ,
            ref : "User"
        },
        video :[
            {
                type : Schema.Types.ObjectId,
                ref : "Video"
            }
        ]
    },
    {timestamps : true})


    export const Playlist = mongoose.model("Playlist" , playlistSchema)