import {v2 as cloudinary} from 'cloudinary';
import { ApiError } from './apierror.js';
import fs from 'fs';

    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    

const uploadOnCloudinary = async (localFilePath)=>{
try{
if(!localFilePath){
    return null;
   
}else{
   const response = await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"
    })
    // console.log("file is uploaded on cloud successfully",response.url);
    fs.unlinkSync(localFilePath);
    return response;
}
}catch(error){
fs.unlinkSync(localFilePath);
return null;
}
}
const deleteFileFromCloudinary = async(fileurl)=>{
try{
    if(!fileurl){
        return null;
    }
    const publicId = fileurl.split('/').pop().split('.')[0];
    const response = await cloudinary.uploader.destroy(publicId);

    if(response.result !== "ok"){
        throw new ApiError("failed to delete image from cloudinary");
    }
}
catch(error){
    console.log("error while deleting the file from cloudinary",error);
    return null;
}
}
   export {uploadOnCloudinary,deleteFileFromCloudinary};