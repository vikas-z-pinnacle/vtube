import mongoose from "mongoose"
import { Blog } from "../models/blog.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getBlogs = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params
        const { page = 1, limit = 10 } = req.query

        const matchCriteria = {};
        if (userId) {
            matchCriteria.createdBy = userId
        }

        console.log(matchCriteria)

        const blogs = await Blog.aggregatePaginate([
            { $match: matchCriteria }
        ], { page, limit })

        return res.status(200).json(
            new ApiResponse(200, blogs, "Blogs fetched successfully")
        )
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiError(500, null, "Error fetching blogs: " + error.message)
            )
    }

})

const addBlog = asyncHandler(async (req, res) => {
    try {
        const { title } = req.body
        const { content } = req.body

        if (title.trim() === "") {
            return res
                .status(400)
                .json(
                    new ApiError(400, null, "Title is required")
                )
        }

        if (content.trim() === "") {
            return res
                .status(400)
                .json(
                    new ApiError(400, null, "Content is required")
                )
        }

        //create new twweet
        const newBlog = await Blog.create({
            title: title,
            content: content,
            createdBy: req.user._id
        })

        return res.status(201).json(
            new ApiResponse(200, newBlog, "Blog created successfully")
        )
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiError(500, null, "Error creating blog: " + error.message)
            )
    }
})

const updateBlog = asyncHandler(async (req, res) => {
    try {
        const { title, content } = req.body
        const { blogId } = req.params

        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json(
                new ApiResponse(400, blogId, "Invalid blogId format")
            )
        }

        const blogData = await Blog.findById(blogId);

        if (!blogData) {
            return res.status(404).json(
                new ApiResponse(404, blogData, "Blog not found")
            )
        }

        const updateValues = {};

        if (content) {
            updateValues.content = content;
        }

        if (title) {
            updateValues.title = title;
        }

        const updatedBlog = await Blog.findByIdAndUpdate(
            blogId,
            updateValues,
            { new: true, runValidators: true }
        );

        return res.status(200).json(
            new ApiResponse(200, updatedBlog, "Blog updated successfully")
        )
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiError(500, null, "Error updating blog: " + error.message)
            )
    }
})

const deleteBlog = asyncHandler(async (req, res) => {
    try {
        const { blogId } = req.params

        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json(
                new ApiResponse(400, blogId, "Invalid blogId format")
            )
        }

        const blogToDelete = await Blog.findById(blogId);

        if (!blogToDelete) {
            return res.status(404).json(
                new ApiResponse(404, blogToDelete, "Blog not found")
            )
        }

        await Blog.deleteOne({ _id: blogId });

        return res.status(200).json(
            new ApiResponse(200, {}, "Blog deleted successfully")
        )
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiError(500, null, "Error deleting blog: " + error.message)
            )
    }
})

export {
    getBlogs,
    addBlog,
    updateBlog,
    deleteBlog
}
