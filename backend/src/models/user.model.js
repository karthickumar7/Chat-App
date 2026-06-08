import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
    },
    fullName:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
        minlength:6,
    },
    profilePic:{
        type:String,
        default:""
    },
    nickName:{
        type:String,
        default:""
    },
    status:{
        type:String,
        default:"Hey there! I am using Chat App."
    },
    resetPasswordToken:{
        type:String
    },
    resetPasswordExpires:{
        type:Date
    },
    lastSeen:{
        type:Date,
        default:Date.now
    },
    blockedUsers:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }]
},{timestamps:true});

const User=mongoose.model("User",userSchema)

export default User;