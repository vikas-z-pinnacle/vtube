import conf from "../conf/conf.js";
import axios from 'axios';
// import store from "../store/store.js";
import { createPost, getAllPost, getPost } from "../store/postSlice.js";

const API_BASE_URL = conf.apiUrl

export class PostService {

    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
        });
    }

    async createPost() {
        //
    }

    async getAllPost() {
        //
    }

    async getPost() {
        //
    }
}

const postService = new PostService();

export default postService;
