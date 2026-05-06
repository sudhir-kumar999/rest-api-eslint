import type { Request,Response } from "express";
import { v4 as uuidv4 } from 'uuid';
import fs from "fs"

interface blogType{
    post_id:string;
    title:string;
    content:string;
    Meta_tag:string;
    author_id:string;
    category:string;
    tags:string[];
    status:string;
}
interface updateBlog{
    post_id?:string;
    title?:string;
    content?:string;
    Meta_tag?:string;
    author_id?:string;
    category?:string;
    tags?:string[];
    status?:string;
}

export const getPost=(req:Request,res:Response)=>{
    try {
        const limit:number=Number(req.query.limit)
        const skip:number=Number(req.query.skip)
        console.log(limit)
        console.log(skip)
        let offset:number=limit*skip
        let last:number=skip*limit+limit
        // console.log(offset)
        // console.log(last)
        let sendData:blogType[]=[]
        fs.readFile("blog.json","utf-8",(err,data)=>{
            if(!err && data){
                let pageData:blogType[]=[]
                sendData=JSON.parse(data)
                pageData=sendData.slice(offset,last)
                return res.status(200).json({
                    success:true,
                    message:"Data fetched successfully",
                    data:pageData
                })
            }
            return res.status(404).json({
                success:false,
                message:"No data found in DB"
            })
        })
    } catch (error:unknown){
    if(error instanceof Error){
   return res.status(500).json({
    success:false,
    message:error.message || "Error occurred at Get all post API"
   })
  }
  }

};

export const addPost=(req:Request,res:Response)=>{
  try {
    const userId:string=String(req.params.userId);
    const bodyData:blogType=req.body
    const id:string=uuidv4()
    bodyData.author_id=userId
    bodyData.post_id=id
    // console.log(bodyData)
    // console.log(userId)

    fs.readFile("blog.json","utf-8",(err,data)=>{
        let readData:blogType[]=[]
        if(!err && data){
            // console.log(data)
            readData=JSON.parse(data)
        }
        readData.push(bodyData)
        fs.writeFile("blog.json",JSON.stringify(readData),(err)=>{
            if(err){
                console.log(err)
            }
            return res.status(201).json({
                success:true,
                message:"Post added successfully"
            })
        })

    })




  } catch (error:unknown){
    if(error instanceof Error){
   return res.status(500).json({
    success:false,
    message:error.message|| " Error occurred at post creation"
   })
  }
  }
};

export const editPost=(req:Request,res:Response)=>{
    try {
        const author_id:string=String(req.query.author_id)
        const blog_id:string=String(req.query.blog_id)
        let bodyData:updateBlog=req.body
        // console.log(bodyData)
        if(bodyData.post_id!=undefined || bodyData.author_id!=undefined){
            return res.status(500).json({
                success:false,
                message:"you cannot update author id and post id"
            })
        }
        console.log(author_id)
        console.log(typeof blog_id)
        if(author_id=="undefined" || blog_id=="undefined"){
            return res.status(500).json({
                success:false,
                message:"please provide author_id and blog_id through params to update record"
            })
        }

        fs.readFile("blog.json","utf-8",(err,data)=>{
            let readData:updateBlog[]=[]
            if(!err && data){
                readData=JSON.parse(data)
                // console.log(readData)
                let filterData:updateBlog[]=[]
                filterData=readData.filter((ele)=>ele.author_id==author_id)
                // console.log(filterData)
                if(filterData.length==0){
                    return res.status(404).json({
                        success:false,
                        message:"No author found with provided author_id"
                    })
                }         
                // console.log(filterData)
                let filterBlog:updateBlog[]=[];
                filterBlog=filterData.filter((ele)=>ele.post_id==blog_id)
                console.log(filterBlog)
                if(filterBlog.length==0){
                    return res.status(404).json({
                        success:false,
                        message:"no blog found with the provided blog_id"
                    })
                }
                let index=readData.findIndex((ele)=>ele.post_id==blog_id)
                console.log(index)
                readData[index]={...readData[index],...bodyData}
                // console.log(readData)

                fs.writeFile("blog.json",JSON.stringify(readData),(err)=>{
                    if(err){
                        return res.status(500).json({
                        success:false,
                        message:"Error while writing data"
                    })
                    }
                })
                return res.status(200).json({
                    success:true,
                    message:"blog with the provided id updated successfully",
                })
            }
            return res.status(404).json({
                        success:false,
                        message:"No data found inside DB"
                    })
        })
    } catch (error:unknown){
    if(error instanceof Error){
   return res.status(500).json({
    success:false,
    message:error.message || "Error occurred at Get all post API"
   })
  }
  }
};

export const deletePost=(req:Request,res:Response)=>{
    try {
        const author_id:string=String(req.query.author_id)
        const blog_id:string=String(req.query.blog_id)
        console.log(author_id)
        console.log(blog_id)
        if(author_id=="undefined" || blog_id=="undefined"){
            return res.status(404).json({
                success:false,
                message:"please provide author_id and blog_id with query params"
            })
        }
        fs.readFile("blog.json","utf-8",(err,data)=>{

        })

    } catch (error:unknown){
    if(error instanceof Error){
   return res.status(500).json({
    success:false,
    message:error.message || "Error occurred at Get all post API"
   })
  }
  }
};

export const getPostByUser=(req:Request,res:Response)=>{

};
