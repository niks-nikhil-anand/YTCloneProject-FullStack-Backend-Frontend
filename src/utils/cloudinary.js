import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
  });


const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if (!localFilePath) return null 
        // upload the file on cloudinary 
        const response = await cloudinary.uploader.upload(localFilePath ,{
            resource_type : "auto" 
        })  
        // file is succesfully uploaded on cloudinary
        fs.unlinkSync(localFilePath)
        return response;  

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved file as it 
        // can be malicious file as it is failed to upload on cloudinary
        return null ;
    }
}

export {uploadOnCloudinary}         
