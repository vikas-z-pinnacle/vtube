import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    try {
        const { content } = req.body

        if(content.trim() === ""){
            return res
                .status(400)
                .json(
                    new ApiError(400, null, "Content is required")
                )
        }

        //create new twweet
        const newTweet = await Tweet.create({
            content: content,
            owner: req.user._id  
        })

        return res.status(201).json(
            new ApiResponse(200, newTweet, "Tweet created successfully")
        )
    } catch (error) {
        return res
                .status(500)
                .json(
                    new ApiError(500, null, "Error creating tweet: " + error.message)
                )
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query
        const { userId } = req.params

        const matchCriteria = {};
        if(userId){
            matchCriteria.owner = userId
        }

        const tweets = await Tweet.aggregatePaginate([
            { $match : matchCriteria }
        ], { page, limit })

        return res.status(200).json(
            new ApiResponse(200, tweets, "Tweets fetched successfully")
        )
    } catch (error) {
        return res
                .status(500)
                .json(
                    new ApiError(500, null, "Error fetching tweets: " + error.message)
                )
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    try {
        const { content } = req.body
        const { tweetId } = req.params

        if(!mongoose.Types.ObjectId.isValid(tweetId)){
            return res.status(400).json(
                new ApiResponse(400, tweetId, "Invalid tweetId format")
            )
        }

        const tweetData = await Tweet.findById(tweetId).populate('owner', 'username');

        if(!tweetData){
            return res.status(404).json(
                new ApiResponse(404, tweetData, "Tweet not found")
            )
        }

        const updateValues = {};

        if(content){
            updateValues.content = content;
        }

        const updatedTweet = await Tweet.findByIdAndUpdate(
            tweetId,
            updateValues,
            {new: true, runValidators: true}
        ).populate("owner", "username");

        return res.status(200).json(
            new ApiResponse(200, updatedTweet, "Tweet updated successfully")
        )
    } catch (error) {
        return res
                .status(500)
                .json(
                    new ApiError(500, null, "Error updating tweet: " + error.message)
                )
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    try {
        const { tweetId } = req.params

        if(!mongoose.Types.ObjectId.isValid(tweetId)){
            return res.status(400).json(
                new ApiResponse(400, tweetId, "Invalid tweetId format")
            )
        }

        const tweetToDelete = await Tweet.findById(tweetId);

        if(!tweetToDelete){
            return res.status(404).json(
                new ApiResponse(404, tweetToDelete, "Tweet not found")
            )
        }

        await Tweet.deleteOne({ _id: tweetId });

        return res.status(200).json(
            new ApiResponse(200, {}, "Tweet deleted successfully")
        )
    } catch (error) {
        return res
                .status(500)
                .json(
                    new ApiError(500, null, "Error deleting tweet: " + error.message)
                )
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
