const mangoose = require("mongoose");

const userSchema = new mangoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true       
    }

})



const userModel = mangoose.model("user",userSchema);

module.exports = userModel;