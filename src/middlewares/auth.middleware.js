import { ApiError } from "../utile/apierror";
import { asyncHandler } from "../utile/asynchandler";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async(req,res,next)=>{

   try {
    const token =  req.cookies?.accessToken || req.header("Authorization")?.replace('Bearer' , "");
 
    if(!token){
     throw new ApiError(401, "unathorized request");
 
    }
    const decodedtoken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
  const user = await User.findById(decodedtoken?._id).select("-password -refreshToken")
  if(!user){
 
     throw new ApiError(401,"Invalid Acess token");
 
  }
  req.user = user;
  next()
   } catch (error) {
    throw new ApiError(401,error?.message || "invalid access token")
   }
})


