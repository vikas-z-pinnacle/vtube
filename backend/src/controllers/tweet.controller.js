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
            throw new ApiError(400, "Content is required")
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
        throw new ApiError(500, "Error creating tweet: " + error.message)
    }
})

const getTweets = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

        const matchCriteria = {};
        if (query) {
            matchCriteria.$or = [
                { content: { $regex: query, $options: 'i' } }
            ];
        }
        if(userId){
            matchCriteria.owner = userId
        }

        // console.log(query)

        const sortOptions = {};
        if(sortBy && sortType){
            sortOptions[sortBy] = sortType === 'desc' ? -1 : 1
        }else{
            sortOptions.createdAt = -1
        }

        const tweets = await Tweet.aggregatePaginate([
            { $match : matchCriteria },
            { $sort: sortOptions }
        ], { page, limit })

        return res.status(200).json(
            new ApiResponse(200, tweets, "Tweets fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error fetching tweets: " + error.message ) 
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
        throw new ApiError(500, "Error updating tweet: " + error.message )
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
        throw new ApiError(500, "Error deleting tweet: " + error.message)
    }
})

export {
    createTweet,
    getTweets,
    updateTweet,
    deleteTweet
}
