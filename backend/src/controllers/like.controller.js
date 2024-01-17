import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json(
                new ApiResponse(400, videoId, "Invalid videoId format")
            )
        }

        // Find the like for the video by user
        const existingLike = await Like.findOne({ video: videoId, likedBy: req.user._id });

        // Toggle the like status
        let newLike;
        if (existingLike) {
            await Like.deleteOne({ _id: existingLike._id });
        } else {
            newLike = await Like.create({ video: videoId, likedBy: req.user._id });
        }

        return res.status(200).json(
            new ApiResponse(200, newLike, "Like status updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error updating like status: " + error.message)
    }
});


const toggleCommentLike = asyncHandler(async (req, res) => {
    try {
        const { commentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json(
                new ApiResponse(400, commentId, "Invalid commentId format")
            )
        }

        // Find the like for the comment by user
        const existingLike = await Like.findOne({ comment: commentId, likedBy: req.user._id });

        // Toggle the like status
        let newLike;
        if (existingLike) {
            await Like.deleteOne({ _id: existingLike._id });
        } else {
            newLike = await Like.create({ comment: commentId, likedBy: req.user._id });
        }

        return res.status(200).json(
            new ApiResponse(200, newLike, "Like status updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error updating like status: " + error.message)
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    try {
        const { tweetId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(tweetId)) {
            return res.status(400).json(
                new ApiResponse(400, tweetId, "Invalid tweetId format")
            )
        }

        // Find the like for the tweet by user
        const existingLike = await Like.findOne({ tweet: tweetId, likedBy: req.user._id });

        // Toggle the like status
        let newLike;
        if (existingLike) {
            await Like.deleteOne({ _id: existingLike._id });
        } else {
            newLike = await Like.create({ tweet: tweetId, likedBy: req.user._id });
        }

        return res.status(200).json(
            new ApiResponse(200, newLike, "Like status updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error updating like status: " + error.message)
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query

        const matchCriteria = {};
        matchCriteria.likedBy = req.user._id
        matchCriteria.video = { $exists: true }

        const likedVideos = await Like.aggregatePaginate([
            {
                $match: matchCriteria
            },
            {
                $lookup: {
                    from: 'videos',
                    localField: 'video',
                    foreignField: '_id',
                    as: 'videoDetails'
                }
            },
            {
                $unwind: '$videoDetails'
            },
            {
                $project: {
                    _id: '$videoDetails._id',
                    title: '$videoDetails.title',
                    description: '$videoDetails.description'
                }
            },
        ], { page, limit });

        // console.log(matchCriteria)

        return res.status(200).json(
            new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error fetching likedVideos: " + error.message)
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}