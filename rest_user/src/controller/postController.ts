import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

interface blogType {
  post_id: string;
  title: string;
  content: string;
  Meta_tag: string;
  author_id: string;
  category: string;
  tags: string[];
  status: string;
}
interface updateBlog {
  post_id?: string;
  title?: string;
  content?: string;
  Meta_tag?: string;
  author_id?: string;
  category?: string;
  tags?: string[];
  status?: string;
}

interface decode {
  name?: string;
  email?: string;
  id?: string;
  iat?: number;
  exp?: number;
}

const stringrgx=/^[A-Za-z ]+$/
// const numberrgx=/^[0-9]+$/
const contentrgx=/^[A-Za-z0-9 ]+$/


interface RequestWithUserRole extends Request {
  user?: decode;
}

export const getPost = (req: Request, res: Response) => {
  try {
    const limit: number = Number(req.query.limit);
    const skip: number = Number(req.query.skip);
    const offset: number = limit * skip;
    const last: number = skip * limit + limit;
    let sendData: blogType[] = [];
    fs.readFile("blog.json", "utf-8", (err, data) => {
      if (!err && data) {
        sendData = JSON.parse(data);
        const pageData: blogType[] = sendData.slice(offset, last);
        return res.status(200).json({
          success: true,
          message: "Data fetched successfully",
          data: pageData,
        });
      }
      return res.status(404).json({
        success: false,
        message: "No data found in DB",
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Error occurred at Get all post API",
      });
    }
  }
};

export const addPost = (req: RequestWithUserRole, res: Response) => {
  try {
    const bodyData: blogType = req.body;
    const {title,meta_tag,content,category,tags,status}=req.body
    const tokenId: decode | undefined = req.user;
    const userId: string = String(tokenId?.id);
    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "No user id found inside token",
      });
    }
    if(status!=="pending" && status!=="published"){
      return res.status(400).json({
        success:false,
        message:"status can only be pending or published"
      })
    }

    if(!stringrgx.test(title)){
      return res.status(401).json({
        success:false,
        message:"title must be string"
      })
    }

    if(typeof content!= "string"){
      return res.status(401).json({
        success:false,
        message:"content must be string or number"
      })
    }
    if(typeof meta_tag!= "string"){
      return res.status(401).json({
        success:false,
        message:"meta_tage must be string"
      })
    }

    if(!contentrgx.test(meta_tag)){
      return res.status(401).json({
        success:false,
        message:"title must be string"
      })
    }

    if(!stringrgx.test(category)){
      return res.status(401).json({
        success:false,
        message:"category must be string"
      })
    }
    if(!Array.isArray(tags)){
      return res.status(401).json({
        success:false,
        message:"tags can only be an array"
      })
    }
    if(tags.length===0){
      return res.status(401).json({
        success:false,
        message:"category must contains some element inside array"
      })
    }



    const id: string = uuidv4();
    bodyData.author_id = userId;
    bodyData.post_id = id;

    fs.readFile("blog.json", "utf-8", (err, data) => {
      let readData: blogType[] = [];
      if (!err && data) {
        readData = JSON.parse(data);
      }
      readData.push(bodyData);
      fs.writeFile("blog.json", JSON.stringify(readData), (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error occurred while writing file",
          });
        }
        return res.status(201).json({
          success: true,
          message: "Post added successfully",
        });
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message: error.message || " Error occurred at post creation",
      });
    }
  }
};

export const editPost = (req: RequestWithUserRole, res: Response) => {
  try {
    const tokenId: decode | undefined = req.user;
    const author_id: string = String(tokenId?.id);
    const blog_id: string = String(req.query.blog_id);
    const bodyData: updateBlog = req.body;
    const {title,meta_tag,content,category,tags,status}=req.body
    if (bodyData.post_id != undefined || bodyData.author_id != undefined) {
      return res.status(500).json({
        success: false,
        message: "you cannot update author id and post id",
      });
    }
    if (blog_id == "undefined") {
      return res.status(400).json({
        success: false,
        message:
          "please provide author_id and blog_id through params to update record",
      });
    }

    if(status!=undefined){
    if(status!=="pending" && status!=="published"){
      return res.status(400).json({
        success:false,
        message:"status can only be pending or published"
      })
    }
  }

    if(title!=undefined){
    if(typeof title !=="string"){
      // if(!stringrgx.test(title)){
      return res.status(401).json({
        success:false,
        message:"title must be string"
      })
    // }
  }
}

if(content!=undefined){
    if(typeof content!= "string"){
      return res.status(401).json({
        success:false,
        message:"content must be string "
      })
    }
  }

  if(meta_tag!=undefined){
    if(typeof meta_tag!=="string"){
      return res.status(401).json({
        success:false,
        message:"title must be string"
      })
    }
  }

  if(category!=undefined){
    if(!stringrgx.test(category)){
      return res.status(401).json({
        success:false,
        message:"category must be string"
      })
    }
  }
  if(tags!=undefined){
    if(!Array.isArray(tags)){
      return res.status(401).json({
        success:false,
        message:"tags can only be an array"
      })
    }
  
    if(tags.length===0){
      return res.status(401).json({
        success:false,
        message:"category must contains some element inside array"
      })
    }
  }

    fs.readFile("blog.json", "utf-8", (err, data) => {
      if (!err && data) {
        const readData: updateBlog[] = JSON.parse(data);
        const filterData: updateBlog[] = readData.filter(
          (ele) => ele.author_id == author_id,
        );
        if (filterData.length == 0) {
          return res.status(404).json({
            success: false,
            message: "No author found with provided author_id",
          });
        }
        const filterBlog: updateBlog[] = filterData.filter(
          (ele) => ele.post_id == blog_id,
        );
        if (filterBlog.length == 0) {
          return res.status(404).json({
            success: false,
            message: "no blog found with the provided blog_id",
          });
        }
        const index = readData.findIndex((ele) => ele.post_id == blog_id);
        readData[index] = { ...readData[index], ...bodyData };

        fs.writeFile("blog.json", JSON.stringify(readData), (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error while writing data",
            });
          }
        });
        return res.status(200).json({
          success: true,
          message: "blog with the provided id updated successfully",
        });
      }
      return res.status(404).json({
        success: false,
        message: "No data found inside DB",
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Error occurred at Get all post API",
      });
    }
  }
};

export const deletePost = (req: RequestWithUserRole, res: Response) => {
  try {
    const tokenId: decode | undefined = req.user;
    const author_id: string = String(tokenId?.id);
    const blog_id: string = String(req.query.blog_id);
    if (blog_id == "undefined") {
      return res.status(400).json({
        success: false,
        message: "please provide author_id and blog_id with query params",
      });
    }
    let readData: blogType[] = [];
    fs.readFile("blog.json", "utf-8", (err, data) => {
      if (!err && data) {
        readData = JSON.parse(data);
        const filterData = readData.filter((ele) => ele.author_id == author_id);
        if (filterData.length == 0) {
          return res.status(404).json({
            success: false,
            message: "no data found with provided author_id",
          });
        }

        const filterPost = filterData.findIndex(
          (ele) => ele.post_id == blog_id,
        );
        if (filterPost == -1) {
          return res.status(404).json({
            success: false,
            message: "no data found with provided blog_id",
          });
        }
        const newData: blogType[] = readData.filter(
          (ele) => ele.post_id != blog_id,
        );
        fs.writeFile("blog.json", JSON.stringify(newData), (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error while writing file",
            });
          }
        });
        return res.status(200).json({
          success: true,
          message: "data deleted successfully",
        });
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Error occurred at Get all post API",
      });
    }
  }
};

export const getPostByUser = (req: RequestWithUserRole, res: Response) => {
  try {
    const tokenId: decode | undefined = req.user;
    const author_id: string = String(tokenId?.id);
    if (author_id == "undefined") {
      return res.status(400).json({
        success: false,
        message: "please provide author id",
      });
    }
    fs.readFile("blog.json", "utf-8", (err, data) => {
      if (!err && data) {
        const readData: blogType[] = JSON.parse(data);
        const filterData = readData.filter((ele) => ele.author_id == author_id);
        if (filterData.length == 0) {
          return res.status(404).json({
            success: false,
            message: "no data found with given author id",
          });
        }
        return res.status(200).json({
          success: true,
          message: "Data fetched successfully by author_id",
          data: filterData,
        });
      }
      return res.status(404).json({
        success: false,
        message: "no data found inside DB",
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Error occurred at Get all post API",
      });
    }
  }
};
