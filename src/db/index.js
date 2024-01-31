import mongoose from "mongoose";
import {DB_NAME} from '../constants'

const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.PORT}/${DB_NAME}`)
        console.log(`/n Mongo DB connected!! HOST :${connectionInstance.connection.host}`) 
    } catch (error) {
       console.log("Mongo DB connection error" , error)
       process.exit(1) 
    }   
}
connectDB()