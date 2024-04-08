import { Router } from 'express';
import {
    addBlog,
    deleteBlog,
    getBlogs,
    updateBlog,
} from "../controllers/blog.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:userId").get(getBlogs);
router.route("/").post(addBlog);
router.route("/b/:blogId").delete(deleteBlog).patch(updateBlog);

export default router