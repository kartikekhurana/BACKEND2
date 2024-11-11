import {asyncHandler} from '../utile/asynchandler.js';
import { ApiError } from '../utile/apierror.js';
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utile/cloudynary.js';
import { ApiResponse } from '../utile/apiresponse.js';
const registerUser = asyncHandler(async (req,res)=>{
   

 const {fullname ,username , email , password }= req.body 
 console.log("body : ", req.body);

//  if(fullname === ""){
//     throw new ApiError(400,"fullname is required");
//  }
//  if(username === ""){
//     throw new ApiError(400,"username is required");
//  }
//  if(email === ""){
//     throw new ApiError(400,"email is required");
//  }
//  if(password === ""){
//     throw new ApiError(400,"password is required");
//  }
// or
 
if(
    
    [fullname,username,email, password].some((field)=>{
        field?.trim() === ""
    })
){
    throw new ApiError(400,"all fields are required");

}
const existedUser = await User.findOne({
    $or:[
{ username },{ email }
    ]
    
})
if(existedUser){
    throw new ApiError(409,"user with email or userame already exists")
}

const avatarLocalPath = req.files?.avatar[0]?.path
// const coverImageLocalPath = req.files?.coverImage[0]?.path
let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
}

if(!avatarLocalPath){
    throw new ApiError(400,"avatar is required");
}
console.log(avatarLocalPath,"path new i want");

let avatar, coverImage;
try{
    avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar){
        throw new ApiError(400,"avatar file upload failed");
    }
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
} catch(error){
    console.log(error);
    throw new ApiError(500,"failed to upload image");
}

if(!avatar){
    throw new ApiError(400,"avatar file required");
}

const user = await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()

})
console.log(user);
const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)
console.log(createdUser);
if(!createdUser){
    throw new ApiError(500,"Something went wrong regitering the user");
}
return res.status(201).json(
    new ApiResponse(200,"user registered succesfully")
)
})


export {registerUser};