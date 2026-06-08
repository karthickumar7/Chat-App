import mongoose from "mongoose"

export const connectDB=async ()=>{
    try{
        const conn=await mongoose.connect(process.env.MONGO_URL);
        console.log(`MONGO DB CONNECTED : ${conn.connection.host}`);
    }catch(err){
        console.log(`Database error ${err.message}`)
    }
}