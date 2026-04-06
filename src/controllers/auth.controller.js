const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

 async function registerController(req,res) {
    const {username,password}= req.body;
    

    const userAllreadyExist = await userModel.findOne({username})
    if (userAllreadyExist){
        return res.status(409).json({
            message:"User Allready Exist"
        })
    }
    const user = await userModel.create({
        username,
        password: await bcrypt.hash(password,10)
    })

    const token = jwt.sign({
        id:user._id,
    },process.env.JWT_SECRET)


    res.cookie("token",token)

    res.status(201).json({
        message:"User Registered Successfully",
        user
    })

 }


 async function loginController(req,res) {
    const {username,password}= req.body;
    const user = await userModel.findOne({username})

    if(!user){
        return res.status(404).json({
            message:"User Not Found"
        })
    }

    const isPasswordMatch = await bcrypt.compare(password,user.password);

    if(!isPasswordMatch){
        return res.status(401).json({
            message:"Invalid Credentials"
        })
    }

    const token = jwt.sign({
        id:user._id
    },process.env.JWT_SECRET)

    res.cookie("token",token)
    res.status(200).json({
        message:"Login Successful",
        user:{
            username:user.username,
            id:user._id
        }
    }) 


 }

 module.exports = {
    registerController,
    loginController
}