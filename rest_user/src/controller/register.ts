import {  type Request, type Response } from "express";
import fs from "fs";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

interface reqData {
  id: string;
  name: string;
  age: number;
  email: string;
  password: string;
  place: string;
  city: string;
}
interface password {
  password: string;
  email: string;
}

export const getData = (req: Request, res: Response) => {
  try {
    fs.readFile(
      "data.json",
      "utf-8",
      (err, data: string) => {
        if (err) {
          return res.status(500).json({
            success:false,
            message:err.message||"error occurred at writing file"
          });
        }
        if (data) {
          const parsed = JSON.parse(data);
          return res.json({
            success: true,
            message: "",
            data: parsed,
          });
        }
        return res.status(404).json({
          success: false,
          message: "no user found in database or json file",
        });
      },
    );
  } catch (error:unknown) {
    if(error instanceof Error){
      res.status(500).json({
        success:false,
        message:error.message || "internal server error"
      });
    }
  }
};

export const postData = async (req: Request, res: Response) => {
  try {
    const remaining=res.getHeader("RateLimit-Remaining");
    const bodyData: reqData = req.body;
    const { password }: password = bodyData;
    const { email }: password = req.body;
    const strPassword = password.toString();
    const hashed = await bcrypt.hash(strPassword, 10);
    const id = uuidv4();
    bodyData.id = id;
    bodyData.password = hashed;
    const path = "data.json";
    if (!fs.existsSync(path)) {
      fs.writeFileSync("path", "");
    }
    fs.readFile("data.json", "utf-8", (err, data) => {
      let pushData: reqData[] = [];
      if (!err && data) {
        pushData = JSON.parse(data);
      }
      const check = pushData.some((ele: reqData) => ele.email == email);
      if (check) {
        return res.status(409).json({
          success: false,
          message: "Email already exist try with new email",
          attemptLeft:remaining
        });
      }
      pushData.push(bodyData);
      fs.writeFile("data.json", JSON.stringify(pushData), (err) => {
        if (err) {
          return res.status(500).json({
            success:false,
            message:err.message||"error occurred at writing file"
          });
        }
        return res.status(201).json({
          success: true,
          message: "user created in json file successfully",
        });
      });
    });
  } catch (error:unknown) {
    if(error instanceof Error){
      res.status(500).json({
        success:false,
        message:error.message || "internal server error"
      });
    }
  }
};

export const updateData = async (req: Request, res: Response) => {
  try {
    let resData:reqData[] = [];
    const bodyData = req.body;
    const id: string = String(req.params.id);
    if(bodyData.email!=undefined){
      return res.status(422).json({
        success:true,
        message:"Email cannot be change"
      });
    }
    fs.readFile("data.json", "utf-8", (err, data) => {
      if (err) {
        return res.status(500).json({
          success:false,
          message:err.message||"error occurred at writing file"
        });
      }
      if (data) {
        resData = JSON.parse(data);
        const item:number = resData.findIndex((ele: reqData) => ele.id == id);
        if (item!=-1) {
          resData[item]={...resData[item],...bodyData};
          fs.writeFile("data.json",JSON.stringify(resData),(err)=>{
            if(err){
              return res.status(500).json({
                success:false,
                message:err.message||"error occurred at writing file"
              });
            }
            return res.status(200).json({
              success:true,
              message:"data updated successfully"
            });
          });
        }else{
          return res.status(404).json({
            success:false,
            message:"No data found with given id. enter the correct id"
          });
        }
      }else{
        return res.status(404).json({
          success:false,
          message:"no data found insert some data to update"
        });
      }
    });
  } catch (error:unknown) {
    if(error instanceof Error){
      res.status(500).json({
        success:false,
        message:error.message || "internal server error"
        
      });
    }
  }
};

export const deleteData = (req: Request, res: Response) => {
  try {
    const id: string = String(req.params.id);
    fs.readFile("data.json", "utf-8", (err, data) => {
      if (err) {
        return res.status(500).json({
          success:false,
          message:err.message||"error occurred at writing file"
        });
      }
      if(data){
        const result = JSON.parse(data);
        const check = result.some((ele: reqData) => ele.id == id);
        if (!check) {
          return res.status(404).json({
            success: false,
            message: "No user found with given id. Give correct id",
          });
        }
        const duplicate = result.filter((ele: reqData) => ele.id !== id);
        fs.writeFile("data.json", JSON.stringify(duplicate), (err) => {
          if (err) {
            return res.status(500).json({
              success:false,
              message:err.message||"error occurred at writing file"
            });
          }
          return res.status(200).json({
            success: true,
            message: "data deleted",
          });
        });
      }else{
        return res.status(404).json({
          success:false,
          message:"no found in db to delete"
        });
      }
    });
  } catch (error:unknown) {
    if(error instanceof Error){
      res.status(500).json({
        success:false,
        message:error.message || "internal server error"
      });
    }
  }
};
