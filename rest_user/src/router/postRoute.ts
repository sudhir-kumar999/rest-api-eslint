import express from "express";
import { addPost, deletePost, editPost, getPost, getPostByUser } from "../controller/postController.ts";
import { limiter } from "../middleware/rateMiddleware.ts";
import { checkLogin } from "../middleware/loginMiddleware.ts";
const postRoutes=express.Router();

postRoutes.get("/allData",getPost);
postRoutes.post("/post",limiter,checkLogin,addPost);
postRoutes.patch("/update",checkLogin,editPost);
postRoutes.delete("/delete",checkLogin,deletePost);
postRoutes.get("/user-wise",getPostByUser);

export default postRoutes;