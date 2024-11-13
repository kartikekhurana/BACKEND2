import {asyncHandler} from '../utile/asynchandler.js';
import { ApiError } from '../utile/apierror.js';
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utile/cloudynary.js';
import { ApiResponse } from '../utile/apiresponse.js';
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId)=>{
    try{

const user = await User.findById(userId)
const accessToken = user.generateAcessToken();
 const refreshToken = user.generateRefreshToken();
 user.refreshToken = refreshToken;
 await user.save({validateBeforeSave : false})
 return {accessToken,refreshToken}
    }
    catch(error){
throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}
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

const loginUser = asyncHandler(async (req,res) =>{

const {email,username,password} = req.body

if(!username && !email){
    throw new ApiError(400,"username or email is required");
}
 const user = await User.findOne({
$or: [{username}, {email}]
})
if(!user){
    throw new ApiError(404,"user does not exist")
}

const isPasswordCorrect =  await user.isPasswordCorrect(password)
if(!isPasswordCorrect){
    throw new ApiError(401,"password is not correct ");
}

const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

 const LoggedInUSer = await User.findById(user._id).select("-password -refreshToken")
 const options = {
    httpOnly: true,
    secure: true
};
return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, "User logged in successfully"));
})

const logoutUser = asyncHandler(async (req,res)=>{
await User.findByIdAndUpdate(
    req.user._id,
    {
        $set : {
            refreshToken:undefined
        }
    },
    {

        new:true,
    }
)
const options = {
    httpOnly: true,
    secure: true
};
return res
.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"user logged out"))
})


const refreshAcessToken = asyncHandler(async(req,res)=>{
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken;
 try {
      if(incomingRefreshToken){
       throw new ApiError(401, "unauthorized request")
      }
      const decodedtoken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
   const user = await User.findById(decodedtoken?._id)
   if(!user){
       throw new ApiError(401, "Invalid refresh token")
      }
      if(incomingRefreshToken !== user?.refreshToken){
       throw new ApiError(401, " refresh token is expired or used")
      }
   
      const options = {
       httpOnly: true,
       secure: true
      }
    const {accessToken ,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",newRefreshToken,options)
   .json(
       new ApiResponse(
           200,
           {accessToken,refreshToken : newRefreshToken},
           "access token generated"
   
       )
   )
 } catch (error) {
   throw new ApiError(401, error?.message || "invalid refreshtoken")
 }
})


export {registerUser,
    loginUser,
    logoutUser,
    refreshAcessToken
};