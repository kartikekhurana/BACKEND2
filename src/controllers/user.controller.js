import {asyncHandler} from '../utile/asynchandler.js';


const registerUser = asyncHandler(async (req,res)=>{
    res.status(200).json({
        message:"kartike ok report"
    })
})

export {registerUser};