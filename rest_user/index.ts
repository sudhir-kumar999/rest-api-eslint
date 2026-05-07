import express from "express";
import type {Request,Response} from "express";
import router from "./src/router/router.ts";
import postRoutes from "./src/router/postRoute.ts";
import cookieParser from "cookie-parser";
const app=express();
app.use(express.json({limit:"100kb"}));
app.use(cookieParser());

app.get("/",(req:Request,res:Response)=>{
  res.send("hello world");
});
app.use("/user",router);
app.use("/blog",postRoutes);

app.listen(3005,()=>{
  console.log("server is running on port 3005");
});
export default app;