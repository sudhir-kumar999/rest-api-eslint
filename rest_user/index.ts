import express from "express";
import type {Request,Response} from "express";
import router from "./src/router/router.ts";
const app=express();

app.use(express.json({limit:"1kb"}));
app.get("/",(req:Request,res:Response)=>{
  res.send("hello world");
});
app.use("/user",router);
app.listen(3005,()=>{
  console.log("server is running on port 3005");
});
export default app;