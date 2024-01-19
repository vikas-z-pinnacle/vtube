import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    postData: null,
    allPosts: []
}

const postSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        createPost: (state, action) => {
            state.postData = action.payload.postData;
        },
        getAllPost: (state, action) => {
            state.allPosts = action.payload.allPosts;
        },
        getPost: (state, action) => {
            state.postData = action.payload.postData;
        }          
    }
})

export const {createPost, getAllPost, getPost} = postSlice.actions;

export default postSlice.reducer;