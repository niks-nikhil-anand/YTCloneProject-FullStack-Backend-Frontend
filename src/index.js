import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path : "./env"
})
connectDB()
.then(()=>{
    app.on("error" , ()=>{
        console.log("Error :" , error)
    })
    app.listen(process.env.PORT , ()=>{
        console.log(`Server is running at Port : ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("DB connection Failed" , err)
})