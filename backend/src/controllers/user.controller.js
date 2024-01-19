import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }


  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiError(500, null, "Something went wrong while generating referesh and access token: " + error.message)
      )
  }
}

const registerUser = asyncHandler(async (req, res) => {
  try {
    //get user details
    const { fullname, username, email, password } = req.body;

    //validation
    if ([fullname, username, email, password].some((field) => field?.trim() === "")) {
      return res
        .status(400)
        .json(
          new ApiError(400, null, "All fields are required")
        )
    }

    //check if already exists by username and email
    const userExists = await User.findOne({
      $or: [{ username }, { email }]
    })

    if (userExists) {
      return res
        .status(409)
        .json(
          new ApiError(409, null, "User with email or username already exists")
        )
    }

    //check for image and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
      return res
        .status(400)
        .json(
          new ApiError(400, null, "Avatar is required")
        )
    }

    //upload media to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
      return res
        .status(400)
        .json(
          new ApiError(400, null, "Avatar is required")
        )
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
    if (!createdUser) {
      return res
        .status(500)
        .json(
          new ApiError(500, null, "Registration failed, please try again")
        )
    }

    //send response
    return res.status(201).json(
      new ApiResponse(200, createdUser, "Registration successful")
    )

  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiError(500, null, "Error creating user: " + error.message)
      )
  }
})

const loginUser = asyncHandler(async (req, res) => {

  const { email, username, password } = req.body
  // console.log(req.body);

  if (!username && !email) {
    return res
      .status(400)
      .json(
        new ApiError(400, null, "username or email is required")
      )
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (!user) {
    return res
      .status(404)
      .json(
        new ApiError(404, null, "User does not exist")
      )
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    return res
      .status(401)
      .json(
        new ApiError(401, null, "Invalid user credentials")
      )
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User logged In Successfully"
      )
    )

})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1 // this removes the field from document
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    return res
      .status(401)
      .json(
        new ApiError(401, null, "Unauthorized request")
      )
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if (!user) {
      return res
        .status(401)
        .json(
          new ApiError(401, null, "Invalid refresh token")
        )
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      return res
        .status(401)
        .json(
          new ApiError(401, null, "Refresh token is expired or used")
        )
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      )
  } catch (error) {
    return res
      .status(401)
      .json(
        new ApiError(401, null, error?.message || "Invalid refresh token")
      )
  }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    return res
      .status(400)
      .json(
        new ApiError(400, null, "Invalid old password")
      )
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(
      200,
      req.user,
      "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body

  if (!fullname || !email) {
    return res
      .status(400)
      .json(
        new ApiError(400, null, "All fields are required")
      )
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email: email
      }
    },
    { new: true }

  ).select("-password")

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    return res
      .status(400)
      .json(
        new ApiError(400, null, "Avatar file is missing")
      )
  }

  //TODO: delete old image - assignment

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    return res
      .status(400)
      .json(
        new ApiError(400, null, "Error while uploading on avatar")
      )

  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    { new: true }
  ).select("-password")

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
    return res
      .status(400)
      .json(
        new ApiError(400, null, "Cover image file is missing")
      )

  }

  //TODO: delete old image - assignment

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage.url) {
    return res
      .status(400)
      .json(
        new ApiError(400, null, "Error while uploading on avatar")
      )
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    { new: true }
  ).select("-password")

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params

  if (!username?.trim()) {
    return res
      .status(400)
      .json(
        new ApiError(400, null, "username is missing")
      )
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1

      }
    }
  ])

  if (!channel?.length) {
    return res
      .status(404)
      .json(
        new ApiError(404, null, "channel does not exists")
      )
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
}