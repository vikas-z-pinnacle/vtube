import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user._id;

    try {
        // Check if the subscription already exists
        const existingSubscription = await Subscription.findOne({
            subscriber: subscriberId,
            channel: channelId
        });

        console.log(existingSubscription);

        if (existingSubscription) {
            // If the subscription exists, then unsubscribe (remove the subscription)
            await Subscription.findByIdAndDelete(existingSubscription._id);

            return res
            .status(200)
            .json(new ApiResponse(
                200,
                [],
                "Unsubscribed successfully"
            ))
        } else {
            // If the subscription doesn't exist, then subscribe (create a new subscription)
            const newSubscription = await Subscription.create({
                subscriber: subscriberId,
                channel: channelId
            })

            console.log(newSubscription);

            return res
            .status(200)
            .json(new ApiResponse(
                200,
                newSubscription,
                "Subscribed successfully"
            ))
        }
    } catch (error) {
        new ApiError(500, "Error toggling subscription: " + error.message)
    }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    try {
        // Find all subscriptions where the given subscriberId matches the subscriber field
        const subscriptions = await Subscription.find({ subscriber: subscriberId })
            .populate('channel', 'username'); // Populate the 'channel' field with the 'username' field from the 'User' model

        // Extract the channel information from the subscriptions
        const subscribedChannels = subscriptions.map(subscription => subscription.channel);

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                subscribedChannels,
                "Channels fetched successfully"
            ))
    } catch (error) {
        new ApiError(500, "Error getting subscribed channels: " + error.message)
    }
});

export default getSubscribedChannels;


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    try {
        const subscriptions = await Subscription.find({ channel: channelId }).populate('subscriber');
        const subscribers = subscriptions.map(subscription => subscription.subscriber);

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                subscribers,
                "Subscribers fetched successfully"
            ))
    } catch (error) {
        new ApiError(500, "Error getting subscribed channels: " + error.message)
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}