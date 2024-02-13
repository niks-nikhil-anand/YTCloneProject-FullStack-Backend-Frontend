import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { apiResponse } from "../utils/apiResponse";


const healthCheck =  asyncHandler(async(req,res) =>{
    return res
    .status(200)
    .json(
        new apiResponse(200 , {} , "Health of server is healthy")
    )
})

export{ healthChech}
