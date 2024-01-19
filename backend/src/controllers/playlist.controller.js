import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    try {
        const { name, description } = req.body

        if ([name, description].some((field) => field?.trim() === "")) {
            return res
                .status(400)
                .json(
                    new ApiError(400, null, "All fields are required")
                )
        }

        const newPlaylist = await Playlist.create({
            name,
            description,
            owner: req.user._id
        })

        return res.status(201).json(
            new ApiResponse(200, newPlaylist, "Playlist created successfully")
        )
    } catch (error) {
        return res
                .status(500)
                .json(
                    new ApiError(500, null, "Error creating playlist: " + error.message)
                )
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json(
                new ApiResponse(400, videoId, "Invalid videoId format")
            )
        }

        const userPlaylist = await Playlist.find({ owner: userId });

        return res.status(200).json(
            new ApiResponse(200, userPlaylist, "User playlist fetched successfully")
        )
    } catch (error) {
        return res
                .status(500)
                .json(
                    new ApiError(500, null, "Error fetching user playlist: " + error.message)
                )
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    try {
        const { playlistId } = req.params

        // Validate that playlistId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(playlistId)) {
            return res.status(400).json(
                new ApiResponse(400, playlistId, "Invalid playlistId format")
            )
        }

        // Find the playlist by playlistId
        const playlist = await Playlist.findById(playlistId).populate('owner', 'username');

        // Check if the playlist exists
        if (!playlist) {
            return res.status(404).json(
                new ApiResponse(404, playlist, "Playlist not found")
            )
        }

        return res.status(200).json(
            new ApiResponse(200, playlist, "Playlist fetched successfully")
        )
    } catch (error) {
        return res
                .status(500)
                .json(
                    new ApiError(500, null, "Error fetching playlist details: " + error.message)
                )
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId, videoId } = req.params;

        // Validate that playlistId and videoId are valid ObjectIds
        if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json(
                new ApiResponse(400, {}, "Invalid playlistId or videoId format")
            )
        }

        // Check if the playlist exists
        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            return res.status(404).json(
                new ApiResponse(404, {}, "Playlist not found")
            )
        }

        // Check if the video is already in the playlist
        if (playlist.videos.includes(videoId)) {
            return res.status(404).json(
                new ApiResponse(400, {}, "Video is already in the playlist")
            )
        }

        // Add the video to the playlist
        playlist.videos.push(videoId);
        await playlist.save();

        return res.status(200).json(
            new ApiResponse(200, {}, "Video added to the playlist successfully")
        )
    } catch (error) {
        return res
                .status(500)
                .json(
                    new ApiError(500, null, "Error adding video to the playlist: " + error.message)
                )
    }
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId, videoId } = req.params;

        // Validate that playlistId and videoId are valid ObjectIds
        if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json(
                new ApiResponse(400, {}, "Invalid playlistId or videoId format")
            )
        }

        // Check if the playlist exists
        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            return res.status(404).json(
                new ApiResponse(404, {}, "Playlist not found")
            )
        }

         // Check if the video is in the playlist
        const videoIndex = playlist.videos.indexOf(videoId);

        if (videoIndex === -1) {
            return res.status(404).json(
                new ApiResponse(400, {}, "Video is not in the playlist")
            )
        }

        // Remove the video from the playlist
        playlist.videos.splice(videoIndex, 1);
        await playlist.save();

        return res.status(200).json(
            new ApiResponse(200, {}, "Video removed from the playlist successfully")
        )
    } catch (error) {
        return res
                .status(500)
                .json(
                    new ApiError(500, null, "Error removing video from the playlist: " + error.message)
                )
    }
})

const deletePlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId } = req.params

        // Validate that playlistId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(playlistId)) {
            return res.status(400).json(
                new ApiResponse(400, playlistId, "Invalid playlistId format")
            )
        }

        // Find the playlist by playlistId
        const playlistToDelete = await Playlist.findById(playlistId);

        // Check if the playlist exists
        if (!playlistToDelete) {
            return res.status(404).json(
                new ApiResponse(404, {}, "Playlist not found")
            )
        }

        // Delete the playlist
        await Playlist.deleteOne({ _id: playlistId });

        return res.status(200).json(
            new ApiResponse(200, {}, "Playlist deleted successfully")
        )
    } catch (error) {
        return res
                .status(500)
                .json(
                    new ApiError(500, null, "Error deleting playlist: " + error.message)
                )
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId } = req.params
        const { name, description } = req.body

        // Validate that playlistId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(playlistId)) {
            return res.status(400).json(
                new ApiResponse(400, playlistId, "Invalid playlistId format")
            )
        }

        // Find the playlist by playlistId
        const playlist = await Playlist.findById(playlistId).populate('owner', 'username');

        // Check if the playlist exists
        if (!playlist) {
            return res.status(404).json(
                new ApiResponse(404, playlist, "Playlist not found")
            )
        }

        //create new data object
        const updateValues = {};

        if (name) {
            updateValues.name = name;
        }
        if (description) {
            updateValues.description = description;
        }

        // Find the playlist by playlistId and update its fields
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            updateValues,
            { new: true, runValidators: true }
        ).populate('owner', 'username');

        return res.status(200).json(
            new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
        )
    } catch (error) {
        return res
                .status(500)
                .json(
                    new ApiError(500, null, "Error updating playlist: " + error.message)
                )
    }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
