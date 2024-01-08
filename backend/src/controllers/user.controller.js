import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    //get user details
    const {fullname, username, email, password} = req.body;

    //validation
    if([fullname, username, email, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required");
    }

    //check if already exists by username and email
    const userExists = await User.findOne({
        $or: [{username}, {email}]
    })

    if(userExists){
        throw new ApiError(409, "User with email or username already exists");
    }

    //check for image and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    //upload media to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar is required")
    }
    
    //create user
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //remove password and refreshToken from user object
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    //check is user created successfully
    if(!createdUser){
        throw new ApiError(500, "Registration failed, please try again")
    }

    //send response
    res.status(201).json(
        new ApiResponse(200, createdUser, "Registration successful")
    )

})

export { registerUser }