import express from "express";
import { addPost, deletePost, editPost, getPost } from "../controller/postController.ts";
const postRoutes=express.Router();

postRoutes.get("/allData",getPost);
postRoutes.post("/post/:userId",addPost);
postRoutes.patch("/update",editPost)
postRoutes.delete("/delete",deletePost)

export default postRoutes;