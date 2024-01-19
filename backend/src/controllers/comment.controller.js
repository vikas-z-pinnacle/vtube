import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        const { page = 1, limit = 10 } = req.query

        const matchCriteria = {};
        if (videoId) {
            matchCriteria.video = videoId
        }

        const comments = await Comment.aggregatePaginate([
            { $match: matchCriteria }
        ], { page, limit })

        return res.status(200).json(
            new ApiResponse(200, comments, "Comments fetched successfully")
        )
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiError(500, null, "Error fetching comments: " + error.message)
            )
    }

})

const addComment = asyncHandler(async (req, res) => {
    try {
        const { content } = req.body
        const { videoId } = req.params

        if (content.trim() === "") {
            return res
                .status(400)
                .json(
                    new ApiError(400, null, "Content is required")
                )
        }

        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json(
                new ApiResponse(400, videoId, "Invalid videoId format")
            )
        }

        //create new twweet
        const newComment = await Comment.create({
            content: content,
            video: videoId,
            owner: req.user._id
        })

        return res.status(201).json(
            new ApiResponse(200, newComment, "Comment created successfully")
        )
    } catch (error) {
        return res
                .status(500)
                .json(
                    new ApiError(500, null, "Error creating comment: " + error.message)
                )
    }
})

const updateComment = asyncHandler(async (req, res) => {
    try {
        const { content } = req.body
        const { commentId } = req.params

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json(
                new ApiResponse(400, commentId, "Invalid commentId format")
            )
        }

        const commentData = await Comment.findById(commentId).populate('owner', 'username');

        if (!commentData) {
            return res.status(404).json(
                new ApiResponse(404, commentData, "Comment not found")
            )
        }

        const updateValues = {};

        if (content) {
            updateValues.content = content;
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            updateValues,
            { new: true, runValidators: true }
        ).populate("owner", "username");

        return res.status(200).json(
            new ApiResponse(200, updatedComment, "Comment updated successfully")
        )
    } catch (error) {
        return res
                .status(500)
                .json(
                    new ApiError(500, null, "Error updating comment: " + error.message)
                )
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    try {
        const { commentId } = req.params

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json(
                new ApiResponse(400, commentId, "Invalid commentId format")
            )
        }

        const commentToDelete = await Comment.findById(commentId);

        if (!commentToDelete) {
            return res.status(404).json(
                new ApiResponse(404, commentToDelete, "Comment not found")
            )
        }

        await Comment.deleteOne({ _id: commentId });

        return res.status(200).json(
            new ApiResponse(200, {}, "Comment deleted successfully")
        )
    } catch (error) {
        return res
                .status(500)
                .json(
                    new ApiError(500, null, "Error deleting comment: " + error.message)
                )
    }
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
