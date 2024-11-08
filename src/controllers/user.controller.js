import {asyncHandler} from '../utile/asynchandler.js';
import { ApiError } from '../utile/apierror.js';
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utile/cloudynary.js';
import { ApiResponse } from '../utile/apiresponse.js';
const registerUser = asyncHandler(async (req,res)=>{
   

 const {fullname ,username , email , password }= req.body 
 console.log("email : ", email);

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
const existedUser = User.findOne({
    $or:[
{ username },{ email }
    ]
    
})
if(existedUser){
    throw new ApiError(409,"user with email or userame already exists")
}

const avatarLocalPath = req.files?.avatar[0]?.path
const coverImageLocalPath = req.files?.coverImage[0]?.path

if(!avatarLocalPath){
    throw new ApiError(400,"avatar is required");
}
const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(coverImageLocalPath);

if(!avatar){
    throw new ApiError(400,"avatar file required");
}

const user = User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage.url || "",
    email,
    password,
    username:username.toLowerCase()

})
const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)
if(!createdUser){
    throw new ApiError(500,"Something went wrong regitering the user");
}
return res.status(201).json(
    new ApiResponse(200,"user registered succesfully")
)
})


export {registerUser};