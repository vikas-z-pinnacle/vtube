import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

        // Build the match criteria based on the query parameters
        const matchCriteria = {};
        if (query) {
            matchCriteria.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ];
        }
        if (userId) {
            matchCriteria.owner = userId;
        }

        // Build the sort options
        const sortOptions = {};
        if (sortBy && sortType) {
            sortOptions[sortBy] = sortType === 'desc' ? -1 : 1;
        } else {
            // Default sorting by timestamp if no sortBy is provided
            sortOptions.createdAt = -1;
        }

        // Perform aggregation and pagination using mongoose-aggregate-paginate-v2
        const videos = await Video.aggregatePaginate([
            { $match: matchCriteria },
            { $sort: sortOptions },
        ], { page, limit });

        return res.status(200).json(
            new ApiResponse(200, videos, "Videos fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error fetching videos: " + error.message)
    }
});

const publishAVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body

        if ([title, description].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }

        //check for image and avatar
        const videoLocalPath = req.files?.videoFile[0]?.path;

        let thumbnailLocalPath;
        if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
            thumbnailLocalPath = req.files.thumbnail[0].path
        }

        if (!videoLocalPath) {
            throw new ApiError(400, "Video is required")
        }

        //upload media to cloudinary
        const video = await uploadOnCloudinary(videoLocalPath)
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

        // console.log(video)

        // Create a new Video document
        const newVideo = await Video.create({
            videoFile: video.url,
            thumbnail: thumbnail.url,
            duration: video.duration,
            owner: req.user._id,
            title: title,
            description: description
        })

        return res.status(201).json(
            new ApiResponse(200, newVideo, "Video published successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error publishing video: " + error.message)
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;

        // Validate that videoId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json(
                new ApiResponse(400, video, "Invalid videoId format")
            )
        }

        // Find the video by videoId
        const video = await Video.findById(videoId).populate('owner', 'username');

        // Check if the video exists
        if (!video) {
            return res.status(404).json(
                new ApiResponse(404, video, "Video not found")
            )
        }

        return res.status(200).json(
            new ApiResponse(200, video, "Video fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error fetching video details: " + error.message)
    }
});

const updateVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
        const { title, description } = req.body;

        // Validate that videoId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json(
                new ApiResponse(400, video, "Invalid videoId format")
            )
        }

        // Find the video by videoId
        const videoData = await Video.findById(videoId).populate('owner', 'username');

        // Check if the video exists
        if (!videoData) {
            return res.status(404).json(
                new ApiResponse(404, videoData, "Video not found")
            )
        }

        //check for image and avatar
        let videoLocalPath;
        if (req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0) {
            videoLocalPath = req.files.videoFile[0].path
        }

        let thumbnailLocalPath;
        if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
            thumbnailLocalPath = req.files.thumbnail[0].path
        }

        //create new data object
        const updateValues = {};

        if (videoLocalPath) {
            const video = await uploadOnCloudinary(videoLocalPath)

            updateValues.videoFile = video.url;
            updateValues.duration = video.duration;
        }
        if (thumbnailLocalPath) {
            const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

            updateValues.thumbnail = thumbnail.url;
        }
        if (title) {
            updateValues.title = title;
        }
        if (description) {
            updateValues.description = description;
        }

        // Find the video by videoId and update its fields
        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            updateValues,
            { new: true, runValidators: true }
        ).populate('owner', 'username');

        return res.status(200).json(
            new ApiResponse(200, updatedVideo, "Video updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error updating video: " + error.message)
    }

})

const deleteVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params

        // Validate that videoId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json(
                new ApiResponse(400, video, "Invalid videoId format")
            )
        }

        // Find the video by videoId
        const videoToDelete = await Video.findById(videoId);

        // Check if the video exists
        if (!videoToDelete) {
            return res.status(404).json(
                new ApiResponse(404, {}, "Video not found")
            )
        }

        // Delete the video
        await Video.deleteOne({ _id: videoId });

        return res.status(200).json(
            new ApiResponse(200, {}, "Video deleted successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error deleting video: " + error.message);
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;

        // Validate that videoId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json(
                new ApiResponse(400, video, "Invalid videoId format")
            )
        }

        // Find the video by videoId
        const videoToToggle = await Video.findById(videoId);

        // Check if the video exists
        if (!videoToToggle) {
            return res.status(404).json(
                new ApiResponse(404, {}, "Video not found")
            )
        }

        // Toggle the isPublished status
        videoToToggle.isPublished = !videoToToggle.isPublished;

        // Save the updated video
        const updatedVideo = await videoToToggle.save();

        return res.status(200).json(
            new ApiResponse(200, updatedVideo, "Publish status updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error status update: " + error.message);
    }
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
