import {  type Request, type Response } from "express";
import fs from "fs";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.ts";
import dotenv from "dotenv";
dotenv.config();
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

interface decode{
    name:string;
    email:string
    id:string;
    iat:number;
    exp:number
}
interface RequestWithUserRole extends Request {
    user?: decode,
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
interface valid{
  email:string,
  password:string
}

export const loginController=((req:Request,res:Response)=>{
  const {email,password}:valid=req.body;
  fs.readFile("data.json","utf-8",async(err,data)=>{
    if(!data){
      return res.status(404).json({
        success:false,
        message:"No data found inside DB"
      });
    }
    const readData:reqData[]=JSON.parse(data);
    const emailCheck=readData.find((ele)=>ele.email==email);
    const hashed:string=String(emailCheck?.password);
    if(emailCheck==undefined){
      return res.status(404).json({
        success:false,
        message:"No email found. kindly sign up or enter right email"
      });
    }
    const isValidPass=await bcrypt.compare(password,hashed);
    if(!isValidPass){
      return res.status(200).json({
        success:true,
        message:"Wrong password. Try again with correct password"
      });
    }

    const name:string=String(emailCheck.name);
    const gmail:string=String(emailCheck.email);
    const id:string=String(emailCheck.id);
      
    const payload={
      name:name,
      email:gmail,
      id:id
    };
    const secret_access_key:string=String(process.env.ACCESS_KEY);
    const accessToken=generateAccessToken(payload,secret_access_key);
    const payload2={
      id:id
    };
      
    res.cookie("accessToken",accessToken,{
      httpOnly:true
    });

    const secret_refresh_key:string=String(process.env.REFRESH_KEY);
    const refreshToken=generateRefreshToken(payload2,secret_refresh_key);
    res.cookie("refreshToken",refreshToken,{
      httpOnly:true
    });

    return res.status(200).json({
      success:true,
      message:" login successful"
    });
  });
});

export const postData = async (req: RequestWithUserRole, res: Response) => {
  try {
    const remaining=res.getHeader("RateLimit-Remaining");
    const bodyData: reqData = req.body;
    // const userId:string=S
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

export const updateData = async (req: RequestWithUserRole, res: Response) => {
  try {
    let resData:reqData[] = [];
    const bodyData = req.body;
    const tokenId:decode|undefined=req.user;
    const author_id:string=String(tokenId?.id);
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
        const item:number = resData.findIndex((ele: reqData) => ele.id == author_id);
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
